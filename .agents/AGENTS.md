# Workspace Rules

- **Build Frequency Constraint:** If the modification is minor (such as simple text renaming, minor translations, or trivial layout adjustments that do not introduce new Tailwind classes or custom CSS rules), you do NOT need to execute `npm run build` (or equivalent build steps) every time. Save build execution only for major changes or when new CSS utility classes are added.

## 🎯 1. มาตรฐานการทำงานและการพัฒนา (Development Standards)
- **Best Practices & Clean Code:** เขียนโค้ดที่สะอาด มีระเบียบ รองรับการขยายระบบ (Scalability) และยึดมาตรฐานสากล (Production-Ready)
- **OOP & SOLID Principles:** เขียนโค้ดตามหลักการ OOP และ SOLID Principles อย่างเคร่งครัด หลีกเลี่ยง God Class / God Object ที่รวม Responsibilities ไว้มากเกินไป และแยกตรรกะการคำนวณ (Business/Math Logic) ออกจากส่วนแสดงผล/ควบคุมเหตุการณ์ (View/Event Controllers)
- **Security First:** ป้องกันช่องโหว่พื้นฐาน เช่น SQL Injection, XSS, CSRF และปฏิบัติตามมาตรฐาน OWASP
- **Performance:** Optimization ทั้งความเร็ว (Loading Speed) และการจัดการหน่วยความจำ (Memory Management)
- **Responsive Design:** รองรับการแสดงผลทุกหน้าจอ (Mobile, Tablet, Desktop) แบบ Mobile-First
- **No Auto-Commits:** ห้ามใช้เครื่องมือหรือรันคำสั่ง Git Commit (`git add`, `git commit`) โดยเด็ดขาด ให้ทิ้งไฟล์ที่แก้ไขไว้ในสถานะ uncommitted เพื่อให้ผู้ใช้งานเป็นผู้ควบคุม Version Control ด้วยตัวเองทั้งหมด
- **Credit Economy & Multi-Agent Restriction:** ใช้เครดิตอย่างประหยัด หากไม่จำเป็นจริงๆ ไม่ต้องใช้ Multi-agent และต้องได้รับอนุญาตจากผู้ใช้งานก่อนเสมอ จึงจะสามารถทำงานที่มีโอกาสบริโภคหรือเผาเครดิตจำนวนมากได
- **Confirm Before Action & Ask Questions:** ก่อนจะทำการเขียนโค้ด ปรับแก้ หรือลงมือทำอะไรก็ตาม ต้องพูดคุย สอบถาม และยืนยันแนวทางกับผู้ใช้งานก่อนเสมอ หากมีส่วนใดไม่เข้าใจหรือมีข้อสงสัย ให้เอ่ยปากถามผู้ใช้งานโดยตรง ห้ามคิดเองทำเองหรือคาดเดาเจตนาเองโดยเด็ดขาด

## 🔄 2. กฎการ Refactor โค้ด (Code Refactoring Rules)
- **ทำความเข้าใจภาพรวม:** ทำความเข้าใจภาพรวมของโครงสร้างระบบและ Architecture ก่อนเริ่มทำการ Refactor
- **รักษาพฤติกรรมเดิมของระบบ:** การ Refactor ต้องรักษาฟังก์ชันการทำงานเดิม และทำให้ระบบต่างๆ ทำงานได้ถูกต้องเหมือนเดิมทุกประการ
- **ย่อยไฟล์และโมดูล:** ย่อยไฟล์ให้มีขนาดสั้นลง แยกส่วนการทำงานออกเป็นโมดูลย่อยๆ เพื่อให้ง่ายต่อการอ่าน และกลับมาแก้ไขปรับปรุงในอนาคต
- **ตรวจสอบผลลัพธ์:** ตรวจสอบและทดสอบผลลัพธ์หลังการ Refactor ให้มั่นใจว่าทำงานได้ตรงตามระบบเดิมอย่างแม่นยำ

## 🎨 3. กฎการจัดการ Style และ CSS (CSS & Styling Rules)
- **รวบรวมไฟล์ CSS:** ไฟล์ CSS ทั้งหมดที่เป็น Source Code ให้จัดเก็บรวบรวมไว้ในโฟลเดอร์ `css/` เดียวกัน
- **แยกไฟล์ Style ใหม่:** เมื่อมีการออกแบบการใช้ Style ใหม่ ให้จัดทำ Style นั้นแยกเป็นไฟล์ `.css` ให้อยู่ในโฟลเดอร์ `css/` แล้วเรียกใช้ (หรือ `@import`) เพื่อให้ง่ายต่อการดูแลและแก้ไขปรับปรุง
- **Strict No White Borders:** ห้ามใส่กรอบสีขาวหรือเส้นขอบสว่าง (เช่น `border border-white`, `border-slate-700` หรือเส้นขอบกรอบขาวใสรอบปุ่ม/องค์ประกอบ) ในองค์ประกอบ UI โดยเด็ดขาด ให้ใช้ดีไซน์ Frameless / Borderless ที่ใช้การเปลี่ยนสีพื้นหลัง (Background Tint) หรือความโปร่งแสงแทน




