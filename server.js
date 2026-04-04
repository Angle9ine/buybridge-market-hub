const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = Number(process.env.PORT) || 3000;

const dataDir = path.join(__dirname, 'data');
const productsJsonPath = path.join(dataDir, 'products.json');
const partnerLogosJsonPath = path.join(dataDir, 'partner-logos.json');
const productImagesDir = path.join(__dirname, 'images', 'products');
const partnerLogosDir = path.join(__dirname, 'images', 'logos');

async function ensureDataDirs() {
    await fs.mkdir(productImagesDir, { recursive: true });
    await fs.mkdir(partnerLogosDir, { recursive: true });
    await fs.mkdir(dataDir, { recursive: true });
}

async function readProductsFile() {
    const raw = await fs.readFile(productsJsonPath, 'utf8');
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : (data.products || []);
    return { wrapper: Array.isArray(data) ? null : data, products: list };
}

async function writeProductsFile(products, wrapper) {
    const out = wrapper && typeof wrapper === 'object' && !Array.isArray(wrapper)
        ? { ...wrapper, products }
        : { products };
    await fs.writeFile(productsJsonPath, JSON.stringify(out, null, 2), 'utf8');
}

async function readPartnerLogosFile() {
    const raw = await fs.readFile(partnerLogosJsonPath, 'utf8');
    return JSON.parse(raw);
}

async function writePartnerLogosFile(doc) {
    await fs.writeFile(partnerLogosJsonPath, JSON.stringify(doc, null, 2), 'utf8');
}

const catalogProductStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, productImagesDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        const safe = path.basename(file.originalname || 'image', ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
        cb(null, `product-${Date.now()}-${safe}${ext}`);
    }
});
const uploadCatalogProduct = multer({
    storage: catalogProductStorage,
    limits: { fileSize: 12 * 1024 * 1024 }
});

const catalogLogoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, partnerLogosDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
        const safe = path.basename(file.originalname || 'logo', ext).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
        cb(null, `partner-${Date.now()}-${safe}${ext}`);
    }
});
const uploadCatalogLogo = multer({
    storage: catalogLogoStorage,
    limits: { fileSize: 6 * 1024 * 1024 }
});

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

app.use(express.static(__dirname));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin-catalog.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-catalog.html'));
});

// ----- Local catalog (JSON + disk images) — use admin-catalog.html while server is running -----
app.post('/api/catalog/product', uploadCatalogProduct.single('image'), async (req, res) => {
    try {
        const name = (req.body.name || '').trim();
        const category = (req.body.category || '').trim();
        const description = (req.body.description || '').trim();
        const price = Number(req.body.price);

        if (!name || !category || !Number.isFinite(price) || price < 0) {
            return res.status(400).json({ error: 'name, category, and a valid price are required' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'product image file is required' });
        }

        const relImg = `images/products/${req.file.filename}`;
        const { wrapper, products } = await readProductsFile();
        const nextId = products.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0) + 1;
        products.push({
            id: nextId,
            name,
            price,
            category,
            description,
            img: relImg
        });
        await writeProductsFile(products, wrapper);
        res.json({ success: true, product: products[products.length - 1] });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save product' });
    }
});

app.post('/api/catalog/partner-logo', uploadCatalogLogo.single('image'), async (req, res) => {
    try {
        const displayName = (req.body.name || '').trim();
        if (!displayName) {
            return res.status(400).json({ error: 'partner display name is required' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'logo image file is required' });
        }

        const doc = await readPartnerLogosFile();
        const base = doc.base || 'images/logos/';
        const partners = Array.isArray(doc.partners) ? doc.partners : [];
        partners.push({ file: req.file.filename, name: displayName });
        await writePartnerLogosFile({ base, partners });
        res.json({ success: true, partner: partners[partners.length - 1], base });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save partner logo' });
    }
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

const host = process.env.HOST || '0.0.0.0';

ensureDataDirs()
    .then(() => {
        const server = app.listen(port, host, () => {
            console.log(`
    --------------------------------------------------
    BuyBridge server running
    Storefront: http://127.0.0.1:${port}
    Catalog admin: http://127.0.0.1:${port}/admin-catalog.html
    --------------------------------------------------
    `);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${port} is already in use. Stop the other process, or use another port (e.g. PORT=3001 node server.js).`);
            } else {
                console.error(err);
            }
            process.exit(1);
        });
    })
    .catch((err) => {
        console.error('Failed to create data/image folders:', err);
        process.exit(1);
    });