import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "../../lib/mongodb";
import { ObjectId } from "mongodb";
import fetch from 'node-fetch';

async function authenticate() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    console.error("Unauthorized request: No token provided");
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { id: decoded.id, role: decoded.role };
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return null;
  }
}

async function sendOneSignalNotification(email, orderId, status, reason) {
  try {
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: "2a61ca63-57b7-480b-a6e9-1b11c6ac7375",
        include_external_user_ids: [email],
        contents: {
          en: `Your order #${orderId} has been ${status}${reason ? `. Reason: ${reason}` : ''}.`,
        },
        headings: { en: 'Order Status Update' },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send OneSignal notification');
    }
    console.log(`Notification sent to ${email} for order ${orderId}`);
  } catch (error) {
    console.error('Error sending OneSignal notification:', error.message);
  }
}

export async function GET(req) {
  try {
    const user = await authenticate();
    if (!user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { db } = await connectToDatabase();
    const ordersCollection = db.collection("orders");
    const productsCollection = db.collection("products");
    const usersCollection = db.collection("users");

    let orders = [];
    if (user.role === "admin") {
      orders = await ordersCollection
        .aggregate([
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true },
          },
          {
            $project: {
              _id: 1,
              userId: 1,
              items: 1,
              paymentMethod: 1,
              shippingDetails: 1,
              status: 1,
              cancellationReason: 1,
              createdAt: 1,
              updatedAt: 1,
              userDetails: {
                name: "$userDetails.name",
                email: "$userDetails.email",
              },
            },
          },
        ])
        .toArray();
    } else {
      orders = await ordersCollection
        .find({ userId: new ObjectId(user.id) })
        .toArray();
    }

    const serializedOrders = await Promise.all(
      orders.map(async (order) => {
        let itemsWithDetails = [];

        if (order.items && Array.isArray(order.items)) {
          itemsWithDetails = await Promise.all(
            order.items.map(async (item) => {
              const product = await productsCollection.findOne({
                _id: new ObjectId(item.productId),
              });
              return {
                productId: item.productId.toString(),
                quantity: item.quantity,
                product: product
                  ? {
                      title: product.title,
                      price: product.price,
                      imageUrl: product.imageUrl || "/placeholder.jpg",
                    }
                  : { title: "Unknown Product", price: 0, imageUrl: "/placeholder.jpg" },
              };
            })
          );
        }

        return {
          _id: order._id.toString(),
          userId: order.userId.toString(),
          items: itemsWithDetails,
          paymentMethod: order.paymentMethod,
          shippingDetails: order.shippingDetails,
          status: order.status,
          cancellationReason: order.cancellationReason,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          ...(user.role === "admin" && { userDetails: order.userDetails }),
        };
      })
    );

    return new Response(JSON.stringify(serializedOrders), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Orders fetch error:", error.message);
    return new Response(JSON.stringify({ message: "Failed to fetch orders" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req) {
  try {
    const user = await authenticate();
    if (!user || user.role !== "user") {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { items, paymentMethod, shippingDetails, status } = await req.json();

    if (!paymentMethod || !shippingDetails || !status) {
      return new Response(
        JSON.stringify({ message: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let validItems = [];
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity < 1) {
          continue;
        }
        validItems.push({
          productId: new ObjectId(item.productId),
          quantity: item.quantity,
        });
      }
      if (validItems.length === 0) {
        return new Response(
          JSON.stringify({ message: "No valid items in order" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ message: "Missing items" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { db } = await connectToDatabase();
    const ordersCollection = db.collection("orders");
    const productsCollection = db.collection("products");

    for (const item of validItems) {
      const product = await productsCollection.findOne({ _id: item.productId });
      if (!product) {
        return new Response(
          JSON.stringify({ message: "One or more products not found" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    const order = {
      userId: new ObjectId(user.id),
      items: validItems,
      paymentMethod,
      shippingDetails,
      status: status || "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await ordersCollection.insertOne(order);
    return new Response(
      JSON.stringify({
        message: "Order placed successfully",
        orderId: result.insertedId.toString(),
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Order creation error:", error.message);
    return new Response(
      JSON.stringify({ message: "Failed to create order" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function PUT(req) {
  try {
    const user = await authenticate();
    if (!user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { orderIds, status, reason } = await req.json();
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !status) {
      return new Response(
        JSON.stringify({ message: "Missing orderIds or status" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ message: "Invalid status" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { db } = await connectToDatabase();
    const ordersCollection = db.collection("orders");
    const usersCollection = db.collection("users");

    let updateFields = { status, updatedAt: new Date() };
    if (status === "cancelled" && reason) {
      updateFields.cancellationReason = reason;
    }

    const results = [];
    for (const orderId of orderIds) {
      const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
      if (!order) {
        results.push({ orderId, success: false, message: "Order not found" });
        continue;
      }

      if (user.role !== "admin" && order.userId.toString() !== user.id) {
        results.push({ orderId, success: false, message: "Unauthorized to update this order" });
        continue;
      }

      if (user.role !== "admin" && status !== "cancelled") {
        results.push({ orderId, success: false, message: "Users can only cancel orders" });
        continue;
      }

      if (user.role !== "admin" && order.status !== "pending") {
        results.push({ orderId, success: false, message: "Only pending orders can be cancelled by users" });
        continue;
      }

      if (status === "cancelled" && !reason && user.role !== "admin") {
        results.push({ orderId, success: false, message: "Reason required for cancellation" });
        continue;
      }

      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: updateFields }
      );

      if (result.matchedCount > 0 && user.role === "admin") {
        const user = await usersCollection.findOne({ _id: new ObjectId(order.userId) });
        if (user && user.email) {
          await sendOneSignalNotification(user.email, orderId, status, reason);
        }
      }

      results.push({
        orderId,
        success: result.matchedCount > 0,
        message: result.matchedCount > 0 ? "Order updated successfully" : "Order not found",
      });
    }

    return new Response(
      JSON.stringify({ results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Order update error:", error.message);
    return new Response(
      JSON.stringify({ message: "Failed to update order" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}