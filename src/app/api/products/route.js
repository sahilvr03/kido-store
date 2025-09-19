// api/products/route.js
import { connectToDatabase } from '../../lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

async function authenticate(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const tokenFromCookie = cookieHeader.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  const token = req.headers.get('authorization')?.split('Bearer ')[1] || tokenFromCookie;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
}

export async function GET(request) {
  try {
    const user = await authenticate(request);
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const isUserView = searchParams.get('user') === 'true';
    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    // Only filter by userId if explicitly requested (user dashboard) and user is not admin
    if (isUserView && user && user.role !== 'admin') {
      query.userId = new ObjectId(user.id);
    }
    const products = await db.collection('products').find(query).toArray();
    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { db } = await connectToDatabase();
    const data = await request.json();
    
    // Validate type field
    if (data.type && !['forYou', 'recommended', 'flashSale'].includes(data.type)) {
      return new Response(JSON.stringify({ error: 'Invalid product type' }), { status: 400 });
    }

    // Validate endDate for flashSale products
    if (data.type === 'flashSale' && data.endDate) {
      const isValidDate = !isNaN(Date.parse(data.endDate));
      if (!isValidDate) {
        return new Response(JSON.stringify({ error: 'Invalid endDate format' }), { status: 400 });
      }
    }

    // Validate images and colors
    if (data.images && !Array.isArray(data.images)) {
      return new Response(JSON.stringify({ error: 'Images must be an array' }), { status: 400 });
    }
    if (data.colors && !Array.isArray(data.colors)) {
      return new Response(JSON.stringify({ error: 'Colors must be an array' }), { status: 400 });
    }

    // Optional: Validate category if present
    if (data.category && typeof data.category !== 'string') {
      return new Response(JSON.stringify({ error: 'Category must be a string' }), { status: 400 });
    }

    const product = {
      ...data,
      userId: user.role === 'admin' ? null : new ObjectId(user.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.collection('products').insertOne(product);
    return new Response(JSON.stringify({ ...product, _id: result.insertedId }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}