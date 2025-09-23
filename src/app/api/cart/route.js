import { connectToDatabase } from '../../lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

async function authenticate(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const tokenFromCookie = cookieHeader.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  const token = req.headers.get('authorization')?.split('Bearer ')[1] || tokenFromCookie;

  if (!token) {
    console.error('Unauthorized: No token provided');
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('JWT decoded successfully:', { id: decoded.id, role: decoded.role, exp: decoded.exp });
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
}

export async function GET(req) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return Response.json({ items: [] }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const cartsCollection = db.collection('carts');
    const productsCollection = db.collection('products');

    const cart = await cartsCollection.findOne({ userId: new ObjectId(user.id) });
    if (!cart || !cart.items) {
      return Response.json({ items: [] });
    }

    // Validate cart items
    const validItems = await Promise.all(
      cart.items.map(async (item) => {
        try {
          const product = await productsCollection.findOne({ _id: new ObjectId(item.productId) });
          if (product) {
            return {
              productId: item.productId.toString(),
              quantity: item.quantity,
              product: {
                _id: product._id.toString(),
                title: product.title,
                price: product.price,
                imageUrl: product.imageUrl || '/placeholder.jpg',
              },
            };
          }
          console.warn(`Invalid product ID in cart: ${item.productId}`);
          return null;
        } catch (error) {
          console.error(`Error validating product ${item.productId}:`, error.message);
          return null;
        }
      })
    );

    const filteredItems = validItems.filter(item => item !== null);

    // Update cart in database if invalid items were removed
    if (filteredItems.length < cart.items.length) {
      await cartsCollection.updateOne(
        { userId: new ObjectId(user.id) },
        { $set: { items: filteredItems.map(item => ({
          productId: new ObjectId(item.productId),
          quantity: item.quantity,
        })), updatedAt: new Date() } }
      );
      console.log(`Removed ${cart.items.length - filteredItems.length} invalid items from cart for user ${user.id}`);
    }

    return Response.json({ items: filteredItems });
  } catch (error) {
    console.error('Cart GET error:', error.message);
    return Response.json({ items: [], message: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { productId, quantity } = await req.json();

    if (!productId || !quantity || quantity < 1) {
      return Response.json({ message: 'Invalid product or quantity' }, { status: 400 });
    }

    try {
      new ObjectId(productId); // Validate ObjectId format
    } catch {
      return Response.json({ message: 'Invalid productId format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const cartsCollection = db.collection('carts');
    const productsCollection = db.collection('products');

    const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      return Response.json({ message: 'Product not found' }, { status: 404 });
    }

    const cart = await cartsCollection.findOne({ userId: new ObjectId(user.id) });
    const newItem = { productId: new ObjectId(productId), quantity };

    if (cart) {
      const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
      let updatedItems = [...cart.items];
      if (itemIndex > -1) {
        updatedItems[itemIndex].quantity += quantity;
      } else {
        updatedItems.push(newItem);
      }
      await cartsCollection.updateOne(
        { userId: new ObjectId(user.id) },
        { $set: { items: updatedItems, updatedAt: new Date() } }
      );
    } else {
      await cartsCollection.insertOne({
        userId: new ObjectId(user.id),
        items: [newItem],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return Response.json({ message: 'Added to cart successfully' });
  } catch (error) {
    console.error('Cart POST error:', error.message);
    return Response.json({ message: 'Failed to add to cart' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await authenticate(req);
    if (!user) {
      console.error("Cart DELETE: No authenticated user, returning empty response");
      return Response.json({ items: [], message: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return Response.json({ message: "ProductId is required" }, { status: 400 });
    }

    try {
      new ObjectId(productId); // Validate ObjectId format
    } catch {
      return Response.json({ message: 'Invalid productId format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const cartsCollection = db.collection("carts");
    const productsCollection = db.collection("products");

    const cart = await cartsCollection.findOne({ userId: new ObjectId(user.id) });
    if (!cart) {
      console.log(`Cart DELETE: No cart found for user ${user.id}, returning empty response`);
      return Response.json({ items: [], message: 'Cart is empty' });
    }

    const updatedItems = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cartsCollection.updateOne(
      { userId: new ObjectId(user.id) },
      { $set: { items: updatedItems, updatedAt: new Date() } }
    );

    const itemsWithDetails = await Promise.all(
      updatedItems.map(async (item) => {
        const product = await productsCollection.findOne({ _id: new ObjectId(item.productId) });
        return {
          productId: item.productId.toString(),
          quantity: item.quantity,
          product: product || {
            _id: item.productId.toString(),
            title: "Unknown Product",
            price: 0,
            imageUrl: "/placeholder.jpg",
          },
        };
      })
    );

    console.log(`Item ${productId} removed successfully for user ${user.id}`);
    return Response.json({ items: itemsWithDetails, message: "Item removed successfully" });
  } catch (error) {
    console.error("Cart DELETE error:", error.message);
    return Response.json({ message: "Failed to remove item", items: [] }, { status: 500 });
  }
}