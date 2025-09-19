import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

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

export async function GET(req, { params }) {
  try {
    const { db } = await connectToDatabase();
    const product = await db.collection('products').findOne({ _id: new ObjectId(params.id) });
    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(product), { status: 200 });
  } catch (error) {
    console.error('Product GET error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch product' }), { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { db } = await connectToDatabase();
    const data = await request.json();
    const { _id, ...productData } = data;

    const existingProduct = await db.collection('products').findOne({ _id: new ObjectId(params.id) });
    if (!existingProduct) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }

    if (user.role !== 'admin' && (existingProduct.userId ? existingProduct.userId.toString() !== user.id : true)) {
      return new Response(JSON.stringify({ error: 'Unauthorized to update this product' }), { status: 403 });
    }

    // Validate type field
    if (productData.type && !['forYou', 'recommended', 'flashSale'].includes(productData.type)) {
      return new Response(JSON.stringify({ error: 'Invalid product type' }), { status: 400 });
    }

    // Validate endDate for flashSale products
    if (productData.type === 'flashSale' && productData.endDate) {
      const isValidDate = !isNaN(Date.parse(productData.endDate));
      if (!isValidDate) {
        return new Response(JSON.stringify({ error: 'Invalid endDate format' }), { status: 400 });
      }
    }

    // Validate images and colors
    if (productData.images && !Array.isArray(productData.images)) {
      return new Response(JSON.stringify({ error: 'Images must be an array' }), { status: 400 });
    }
    if (productData.colors && !Array.isArray(productData.colors)) {
      return new Response(JSON.stringify({ error: 'Colors must be an array' }), { status: 400 });
    }

    // Optional: Validate category if present
    if (productData.category && typeof productData.category !== 'string') {
      return new Response(JSON.stringify({ error: 'Category must be a string' }), { status: 400 });
    }

    // Preserve the existing userId unless the user is an admin
    const updateData = {
      ...productData,
      userId: user.role === 'admin' ? null : existingProduct.userId || new ObjectId(user.id),
      updatedAt: new Date(),
    };

    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }

    const updatedProduct = await db.collection('products').findOne({ _id: new ObjectId(params.id) });
    return new Response(JSON.stringify(updatedProduct), { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticate(request);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { db } = await connectToDatabase();

    const existingProduct = await db.collection('products').findOne({ _id: new ObjectId(params.id) });
    if (!existingProduct) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }

    if (user.role !== 'admin' && (existingProduct.userId ? existingProduct.userId.toString() !== user.id : true)) {
      return new Response(JSON.stringify({ error: 'Unauthorized to delete this product' }), { status: 403 });
    }

    const result = await db.collection('products').deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }

    await db.collection('flashSales').deleteMany({ productId: params.id });

    return new Response(JSON.stringify({ message: 'Product deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}