// public/script.js (Front-end Logic)
const menuList = document.getElementById('menu-list');
const cartItems = document.getElementById('cart-items');
const totalPriceSpan = document.getElementById('total-price');
const placeOrderBtn = document.getElementById('place-order-btn');
const statusDisplaySection = document.getElementById('status-display');

let menuData = [];
let cart = {}; // {id: quantity}

// 1. ดึงข้อมูลเมนู
async function fetchMenu() {
    try {
        const response = await fetch('/api/menu');
        menuData = await response.json();
        renderMenu();
    } catch (error) {
        console.error('Error fetching menu:', error);
        menuList.innerHTML = '<p>ไม่สามารถโหลดเมนูได้ กรุณาลองใหม่อีกครั้ง</p>';
    }
}

// 2. แสดงผลเมนู
function renderMenu() {
    menuList.innerHTML = '<h2>รายการลูกชิ้น</h2>';
    menuData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.innerHTML = `
            <h3>${item.name} (${item.type})</h3>
            <p>ราคา: ${item.price} บาท/ไม้</p>
            <button onclick="addToCart('${item.id}')">เพิ่มลงตะกร้า</button>
        `;
        menuList.appendChild(div);
    });
}

// 3. เพิ่มสินค้าในตะกร้า
function addToCart(itemId) {
    cart[itemId] = (cart[itemId] || 0) + 1;
    updateCart();
}

// 4. อัปเดตตะกร้าสินค้า
function updateCart() {
    cartItems.innerHTML = '';
    let total = 0;
    
    for (const id in cart) {
        if (cart[id] > 0) {
            const item = menuData.find(m => m.id === id);
            if (item) {
                const li = document.createElement('li');
                li.textContent = `${item.name} x ${cart[id]} (${item.price * cart[id]} บาท)`;
                cartItems.appendChild(li);
                total += item.price * cart[id];
            }
        }
    }
    totalPriceSpan.textContent = total.toFixed(2);
}

// 5. ส่งคำสั่งซื้อ
placeOrderBtn.addEventListener('click', async () => {
    const items = Object.keys(cart)
        .filter(id => cart[id] > 0)
        .map(id => ({ id: id, quantity: cart[id] }));

    if (items.length === 0) {
        alert('กรุณาเลือกรายการลูกชิ้นก่อน');
        return;
    }

    try {
        const response = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: items, customerName: 'Guest' }) // เพิ่มข้อมูลลูกค้าจริงในภายหลัง
        });

        const result = await response.json();
        if (response.ok) {
            alert(`สั่งซื้อสำเร็จ! รหัส: ${result.orderId}`);
            
            // แสดงสถานะ
            document.getElementById('order-id-display').textContent = result.orderId;
            document.getElementById('current-status').textContent = result.status;
            document.getElementById('ready-time-display').textContent = result.readyTime;
            statusDisplaySection.style.display = 'block';
            
            // ล้างตะกร้า
            cart = {};
            updateCart();
            
            // เริ่มการตรวจสอบสถานะอัตโนมัติ (ไม่ควรใช้ใน Production จริงแบบไม่มีการควบคุม)
            // setTimeout(checkOrderStatus, 5000, result.orderId); 

        } else {
            alert('เกิดข้อผิดพลาดในการสั่งซื้อ: ' + result.message);
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
});

// 6. การตรวจสอบสถานะคำสั่งซื้อ (เมื่อลูกค้ากดปุ่ม)
document.getElementById('check-status-btn').addEventListener('click', async () => {
    const orderId = document.getElementById('order-id-display').textContent;
    if (!orderId) return;

    try {
        const response = await fetch(`/api/order/status/${orderId}`);
        const result = await response.json();

        if (response.ok) {
            document.getElementById('current-status').textContent = result.status;
            alert(`สถานะล่าสุด: ${result.status}. พร้อมรับ: ${result.readyTime}`);
        } else {
            alert('ไม่พบคำสั่งซื้อ');
        }
    } catch (error) {
        console.error('Status check error:', error);
    }
});

// เริ่มต้นแอปพลิเคชัน
fetchMenu();