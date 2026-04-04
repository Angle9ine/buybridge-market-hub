const express = require('express');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = 3000;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
    api_key: process.env.CLOUDINARY_API_KEY || 'your_api_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret'
});

// Configure OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key'
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json());

// UPDATED: Better static file handling for Electron
app.use(express.static(__dirname)); 
app.use('/public', express.static(path.join(__dirname, 'public')));

// FORCE HOME ROUTE
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ADMIN ROUTE
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ======================
// MAIN ORDER ENDPOINT
// ======================
app.post('/order', (req, res) => {
    const { name, phone, product, note } = req.body;

    console.log('════════════════════════════════════');
    console.log('🚀 NEW ORDER RECEIVED - BuyBridge');
    console.log('════════════════════════════════════');
    console.log(`Name     : ${name}`);
    console.log(`Phone    : ${phone}`);
    console.log(`Product  : ${product}`);
    console.log(`Note     : ${note || 'None'}`);
    console.log(`Time     : ${new Date().toLocaleString()}`);
    console.log('════════════════════════════════════');

    const successMessage = `
        <div style="font-family: sans-serif; padding: 20px; border: 2px solid gold; border-radius: 15px;">
            <h2 style="color: #000;">Thank you, ${name}!</h2>
            <p>Your order for <strong>"${product}"</strong> is being processed.</p>
            <hr>
            <p><strong>✅ Payment Details:</strong></p>
            <p>Bank: <strong>Opay</strong></p>
            <p>Account Name: <strong>9th Cri-80-ivities Empire</strong></p>
            <p>Account Number: <strong>9158526386</strong></p>
            <hr>
            <p>Send payment proof to WhatsApp: <strong>+234 915 852 6386</strong></p>
            <p><em>BuyBridge Market Hub by 9th Cri-80-ivities Empire</em></p>
        </div>
    `;

    res.send(successMessage);
});

// ======================
// SELLER INQUIRY ENDPOINT
// ======================
app.post('/sell', (req, res) => {
    const { name, phone, item, description } = req.body;

    console.log('════════════════════════════════════');
    console.log('📦 NEW SELLER INQUIRY - BuyBridge');
    console.log('════════════════════════════════════');
    console.log(`Seller   : ${name}`);
    console.log(`Phone    : ${phone}`);
    console.log(`Item     : ${item}`);
    console.log(`Desc     : ${description}`);
    console.log('════════════════════════════════════');

    res.send(`Success! We received your request to sell "${item}". Our team will contact you on WhatsApp via ${phone} shortly.`);
});

// ======================
// ADD PRODUCT ENDPOINT (with automatic image upload/generation)
// ======================
app.post('/add-product', upload.single('image'), async (req, res) => {
    try {
        const { name, price, category, description } = req.body;
        
        let imageUrl = '';
        
        if (req.file) {
            const stream = require('stream');
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'buybridge-products' },
                (error, result) => {
                    if (error) return res.status(500).json({ error: 'Image upload failed' });
                    
                    logProduct(name, price, category, description, result.secure_url);
                    res.json({
                        success: true,
                        message: 'Product added successfully!',
                        product: { name, price, category, description, imageUrl: result.secure_url }
                    });
                }
            );
            
            const readableStream = new stream.Readable();
            readableStream.push(req.file.buffer);
            readableStream.push(null);
            readableStream.pipe(uploadStream);

        } else {
            // AI Generation Logic
            const prompt = `Create a professional product image for: ${name}. Style: Clean, modern, high-quality product photography, white background.`;
            const aiResponse = await openai.images.generate({
                model: "dall-e-3",
                prompt: prompt,
                size: "1024x1024",
                n: 1,
            });
            
            imageUrl = aiResponse.data[0].url;
            const cloudinaryResponse = await cloudinary.uploader.upload(imageUrl, {
                folder: 'buybridge-products/ai-generated'
            });
            
            logProduct(name, price, category, description, cloudinaryResponse.secure_url);
            res.json({
                success: true,
                message: 'Product added with AI image!',
                product: { name, price, category, description, imageUrl: cloudinaryResponse.secure_url }
            });
        }
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

function logProduct(name, price, category, description, imageUrl) {
    console.log('════════════════════════════════════');
    console.log('🆕 NEW PRODUCT ADDED - BuyBridge');
    console.log('════════════════════════════════════');
    console.log(`Name        : ${name}`);
    console.log(`Price       : ₦${price}`);
    console.log(`Category    : ${category}`);
    console.log(`Image URL   : ${imageUrl}`);
    console.log('════════════════════════════════════');
}

// 404 Handler
app.use((req, res) => {
    res.status(404).send('Resource not found on BuyBridge Server.');
});

// Start Server
app.listen(port, () => {
    console.log(`
    --------------------------------------------------
    ✅ BuyBridge Server Active
    🌐 URL: http://localhost:${port}
    🚀 Status: Ready for Orders
    --------------------------------------------------
    `);
});