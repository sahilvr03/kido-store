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
    console.log("JWT decoded successfully:", { id: decoded.id, role: decoded.role, exp: decoded.exp });
    // Check expiry explicitly (in case of clock skew)
    if (decoded.exp * 1000 < Date.now()) {
      console.error("Token expired");
      return null;
    }
    return { id: decoded.id, role: decoded.role, email: decoded.email }; // Assuming email is in payload
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return null;
  }
}

async function sendOneSignalNotification(email, orderId, status, reason) {
  try {
    const appId = process.env.ONESIGNAL_APP_ID || "2a61ca63-57b7-480b-a6e9-1b11c6ac7375"; // Use env var
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_external_user_ids: [email],
        contents: {
          en: `Your order #${orderId} has been ${status}${reason ? `. Reason: ${reason}` : ''}.`,
        },
        headings: { en: 'Order Status Update' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OneSignal API error: ${response.status}`);
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
    return new Response(JSON.stringify({ message: "Failed to fetch orders", error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req) {
  try {
    const user = await authenticate();
    if (!user || user.role !== "user") {
      return new Response(JSON.stringify({ message: "Unauthorized: Invalid user role or token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return new Response(JSON.stringify({ message: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { items, productId, quantity, paymentMethod, shippingDetails, status } = body;

    if (!paymentMethod || !shippingDetails) {
      return new Response(JSON.stringify({ message: "Missing required fields: paymentMethod or shippingDetails" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Support single-product Buy Now: auto-wrap into items array
    let validItems = [];
    if (items && Array.isArray(items) && items.length > 0) {
      // Multi-item from cart
      validItems = items.filter(item => {
        if (!item.productId || !item.quantity || item.quantity < 1) {
          console.warn("Invalid item skipped:", item);
          return false;
        }
        try {
          new ObjectId(item.productId); // Validate ObjectId early
          return true;
        } catch {
          console.error("Invalid ObjectId:", item.productId);
          return false;
        }
      });
    } else if (productId && quantity && quantity >= 1) {
      // Single-product fallback
      try {
        new ObjectId(productId);
        validItems = [{ productId: new ObjectId(productId), quantity }];
      } catch (idError) {
        return new Response(JSON.stringify({ message: "Invalid productId: Not a valid ObjectId" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (validItems.length === 0) {
      return new Response(JSON.stringify({ message: "No valid items in order" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { db } = await connectToDatabase();
    const ordersCollection = db.collection("orders");
    const productsCollection = db.collection("products");

    // Validate products exist and stock
    for (const item of validItems) {
      const product = await productsCollection.findOne({ _id: item.productId });
      if (!product) {
        return new Response(JSON.stringify({ message: "One or more products not found" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!product.inStock || product.stock < item.quantity) { // Assuming 'stock' field exists
        return new Response(JSON.stringify({ message: `Insufficient stock for product ${product.title}` }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
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
    const orderId = result.insertedId.toString();

    // Send notification on creation
    if (user.email) {
      await sendOneSignalNotification(user.email, orderId, "placed", null);
    }

    return new Response(
      JSON.stringify({
        message: "Order placed successfully",
        orderId,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Order creation error:", error.message);
    return new Response(JSON.stringify({ message: "Failed to create order", error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ message: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { orderIds, status, reason } = body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !status) {
      return new Response(JSON.stringify({ message: "Missing orderIds or status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ message: "Invalid status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { db } = await connectToDatabase();
    const ordersCollection = db.collection("orders");
    const usersCollection = db.collection("users");

    let updateFields = { status, updatedAt: new Date() };
    if (status === "cancelled" && reason) {
      updateFields.cancellationReason = reason;
    }

    const results = [];
    for (const orderIdStr of orderIds) {
      try {
        new ObjectId(orderIdStr); // Validate early
      } catch {
        results.push({ orderId: orderIdStr, success: false, message: "Invalid orderId format" });
        continue;
      }

      const order = await ordersCollection.findOne({ _id: new ObjectId(orderIdStr) });
      if (!order) {
        results.push({ orderId: orderIdStr, success: false, message: "Order not found" });
        continue;
      }

      if (user.role !== "admin" && order.userId.toString() !== user.id) {
        results.push({ orderId: orderIdStr, success: false, message: "Unauthorized to update this order" });
        continue;
      }

      if (user.role !== "admin" && status !== "cancelled") {
        results.push({ orderId: orderIdStr, success: false, message: "Users can only cancel orders" });
        continue;
      }

      if (user.role !== "admin" && order.status !== "pending") {
        results.push({ orderId: orderIdStr, success: false, message: "Only pending orders can be cancelled by users" });
        continue;
      }

      if (status === "cancelled" && !reason && user.role !== "admin") {
        results.push({ orderId: orderIdStr, success: false, message: "Reason required for cancellation" });
        continue;
      }

      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(orderIdStr) },
        { $set: updateFields }
      );

      if (result.matchedCount > 0 && user.role === "admin") {
        const orderUser = await usersCollection.findOne({ _id: new ObjectId(order.userId) });
        if (orderUser && orderUser.email) {
          await sendOneSignalNotification(orderUser.email, orderIdStr, status, reason);
        }
      }

      results.push({
        orderId: orderIdStr,
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
    return new Response(JSON.stringify({ message: "Failed to update order", error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}