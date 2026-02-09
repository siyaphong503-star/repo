// server.js (Back-end Logic)
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const PORT = 3000;

// ใช้ Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // ให้บริการไฟล์ในโฟลเดอร์ public

// ฐานข้อมูลจำลอง (ใช้ในระหว่างการพัฒนา)
let orders = [];
const menu = JSON.parse(fs.readFileSync('menu.json'));

// --- API Endpoints ---

// 1. ดึงเมนูทั้งหมด
app.get('/api/menu', (req, res) => {
    res.json(menu);
});

// 2. รับคำสั่งซื้อใหม่
app.post('/api/order', (req, res) => {
    const newOrder = req.body;
    
    // การคำนวณราคาและเวลา
    let total = 0;
    newOrder.items.forEach(item => {
        const menuItem = menu.find(m => m.id === item.id);
        if (menuItem) {
            total += menuItem.price * item.quantity;
        }
    });

    const orderId = Date.now().toString();
    const preparationTime = 15; // ประมาณ 15 นาที
    const readyTime = new Date(Date.now() + preparationTime * 60000); // คำนวณเวลาที่พร้อมรับ

    const fullOrder = {
        id: orderId,
        ...newOrder,
        total: total,
        status: 'Preparing', // 'Preparing', 'Frying', 'Ready'
        readyTime: readyTime.toLocaleTimeString('th-TH'),
        timestamp: new Date()
    };
    
    orders.push(fullOrder);
    console.log(`New Order #${orderId} received. Total: ${total}`);

    // ส่งข้อมูลยืนยันกลับไปให้ลูกค้า
    res.status(201).json({ 
        message: 'Order received successfully!', 
        orderId: orderId,
        readyTime: fullOrder.readyTime,
        status: fullOrder.status
    });
});

// 3. (สำหรับลูกค้า) ตรวจสอบสถานะคำสั่งซื้อ
app.get('/api/order/status/:id', (req, res) => {
    const orderId = req.params.id;
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        res.json({ id: order.id, status: order.status, readyTime: order.readyTime });
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

// (API สำหรับ Admin: การอัปเดตสถานะ, การแสดงคิวทั้งหมด - ต้องมีการป้องกันด้วยรหัสผ่าน)
// ...

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('--- Development Environment ---');
});