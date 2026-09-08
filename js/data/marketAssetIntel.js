/**
 * marketAssetIntel.js - Macro Intelligence & Knowledge Data for Market Center Assets
 * Structured with: What is it, Trading Unit, Global Significance, and Price Impact.
 */

export const MARKET_ASSET_INTEL = {
    'BINANCE:BTCUSDT': {
        name: 'Bitcoin (BTC / USDT)',
        category: 'Crypto & Digital Assets',
        badgeClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        iconText: 'BTC',
        symbolName: 'BTCUSDT',
        exchange: 'Binance / Global Crypto',
        whatIsIt: 'เงินดิจิทัลกระจายศูนย์ตัวแรกของโลก ไร้ตัวกลาง มีจำกัด 21 ล้านเหรียญ ได้รับฉายาว่า "ทองคำดิจิทัล"',
        tradingUnit: 'ซื้อ Bitcoin ได้เต็ม 1 เหรียญ (1 BTC หรือ 100 ล้าน Satoshi) ในสกุลเงินดอลลาร์ดิจิทัล (USDT)',
        significance: 'ผู้นำตลาดคริปโต สะท้อนสภาพคล่องทางการเงินและความกล้าเสี่ยง (Risk-On) ของนักลงทุนทั่วโลก',
        priceImpact: 'ชี้นำทิศทางตลาดสินทรัพย์ดิจิทัล ดึงดูดเม็ดเงินจากตลาดทุนดั้งเดิม และสะท้อนความต้องการสภาพคล่องโลก'
    },

    'OANDA:XAUUSD': {
        name: 'Gold (XAU / USD - ทองคำ)',
        category: 'Precious Metals / Safe Haven',
        badgeClass: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
        iconText: 'XAU',
        symbolName: 'XAUUSD',
        exchange: 'OANDA / Global Spot FX & Metals',
        whatIsIt: 'โลหะมีค่า ทุนสำรองสากลที่รักษามูลค่า ไม่เสื่อมสลาย และไม่มีความเสี่ยงจากการผิดนัดชำระหนี้',
        tradingUnit: 'สกุล USD ซื้อทองคำแท้ได้ 31.10 กรัม (1 ทรอยออนซ์ หรือประมาณ 2 บาททองคำไทย)',
        significance: 'สินทรัพย์ปลอดภัยสูงสุด (Safe Haven) และทุนสำรองหลักของธนาคารกลาง ใช้กันความเสี่ยงเงินเฟ้อและสงคราม',
        priceImpact: 'ราคาพุ่งเมื่อตลาดกลัว (Risk-Off) หรือเกิดเงินเฟ้อ มักกดดันค่าเงินดอลลาร์และผลตอบแทนพันธบัตร'
    },

    'OANDA:XAGUSD': {
        name: 'Silver (XAG / USD - โลหะเงิน)',
        category: 'Precious & Industrial Metals',
        badgeClass: 'bg-slate-400/15 text-slate-300 border border-slate-400/30',
        iconText: 'XAG',
        symbolName: 'XAGUSD',
        exchange: 'OANDA / Global Spot FX & Metals',
        whatIsIt: 'โลหะนำไฟฟ้าและความร้อนดีที่สุด มีสถานะกึ่งสินทรัพย์ปลอดภัยและโลหะอุตสาหกรรมยุคใหม่',
        tradingUnit: 'สกุล USD ซื้อโลหะเงินแท้ได้ 31.10 กรัม (เท่ากับ 1 ทรอยออนซ์)',
        significance: 'วัตถุดิบสำคัญในแผงโซลาร์เซลล์ รถยนต์ไฟฟ้า (EV) ชิปประมวลผล AI และอุปกรณ์ 5G',
        priceImpact: 'ผันผวนแรงกว่าทองคำ 2–3 เท่า กระทบต้นทุนอุตสาหกรรมเทคโนโลยีและพลังงานสะอาดโดยตรง'
    },

    'TVC:USOIL': {
        name: 'WTI Crude Oil (น้ำมันดิบ WTI)',
        category: 'Energy Commodities',
        badgeClass: 'bg-amber-600/15 text-amber-400 border border-amber-600/30',
        iconText: 'OIL',
        symbolName: 'USOIL',
        exchange: 'NYMEX / TVC Global Energy',
        whatIsIt: 'น้ำมันดิบชนิดเบากำมะถันต่ำ ส่งมอบหลักที่ Cushing สหรัฐฯ เกณฑ์อ้างอิงราคาพลังงานโลก',
        tradingUnit: 'สกุล USD ซื้อน้ำมันดิบได้ 158.99 ลิตร (เท่ากับ 1 บาร์เรล หรือประมาณ 0.16 ลบ.ม.)',
        significance: 'เส้นเลือดหลักของเศรษฐกิจและการขนส่งโลก เป็นตัวขับเคลื่อนดัชนีเงินเฟ้อ (CPI) โดยตรง',
        priceImpact: 'ถ้าราคาพุ่ง ค่าขนส่งและราคาสินค้าจะแพงขึ้น บีบให้ธนาคารกลางต้องขึ้นดอกเบี้ยเพื่อคุมเงินเฟ้อ'
    },

    'CAPITALCOM:COPPER': {
        name: 'High Grade Copper (ทองแดง - Dr. Copper)',
        category: 'Industrial Metals',
        badgeClass: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
        iconText: 'CPR',
        symbolName: 'COPPER',
        exchange: 'COMEX / Capital.com',
        whatIsIt: 'โลหะอุตสาหกรรมหลัก ฉายา "Dr. Copper" จากความสามารถตรวจวัดสุขภาพเศรษฐกิจโลก',
        tradingUnit: 'สกุล USD ซื้อทองแดงบริสุทธิ์ได้ 0.4536 กิโลกรัม (453.6 กรัม หรือเท่ากับ 1 ปอนด์)',
        significance: 'หัวใจของมอเตอร์ EV, ระบบโครงข่ายไฟฟ้า (Power Grid), กังหันลม และ Data Center AI',
        priceImpact: 'ราคาขึ้น = ภาคการผลิตและการก่อสร้างโลกกำลังขยายตัว / ราคาดิ่ง = เตือนภัยเศรษฐกิจถดถอย'
    },

    'CAPITALCOM:WHEAT': {
        name: 'Wheat (ข้าวสาลี)',
        category: 'Agricultural / Grains',
        badgeClass: 'bg-yellow-600/15 text-yellow-300 border border-yellow-600/30',
        iconText: 'WHT',
        symbolName: 'WHEAT',
        exchange: 'CBOT / Capital.com',
        whatIsIt: 'พืชอาหารหลักของโลก แหล่งวัตถุดิบแป้งสาลีเพื่อทำขนมปัง บะหมี่ พาสต้า และเบเกอรี่',
        tradingUnit: 'หน่วยราคาคือ US Cents ซื้อเมล็ดข้าวสาลีได้ 27.22 กิโลกรัม (เท่ากับ 1 บุชเชล)',
        significance: 'ตัวชี้วัดความมั่นคงทางอาหารโลก ปลูกหลักในสหรัฐฯ ยุโรป และภูมิภาคทะเลดำ (รัสเซีย-ยูเครน)',
        priceImpact: 'อ่อนไหวต่อสงครามและภัยแล้ง หากราคาพุ่งจะดันราคาอาหารสำเร็จรูปทั่วโลกแพงขึ้นทันที'
    },

    'CAPITALCOM:CORN': {
        name: 'Corn (ข้าวโพด)',
        category: 'Agricultural / Feed & Biofuel',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        iconText: 'CORN',
        symbolName: 'CORN',
        exchange: 'CBOT / Capital.com',
        whatIsIt: 'พืชไร่อเนกประสงค์ วัตถุดิบหลักผลิตอาหารสัตว์ เอทานอลชีวภาพ และน้ำเชื่อมข้าวโพด',
        tradingUnit: 'หน่วยราคาคือ US Cents ซื้อเมล็ดข้าวโพดได้ 25.40 กิโลกรัม (เท่ากับ 1 บุชเชล)',
        significance: 'จุดเชื่อมโยงระหว่างภาคเกษตร ภาคปศุสัตว์ และพลังงานทดแทน (เอทานอลผสมเบนซิน)',
        priceImpact: 'กระทบต้นทุนการเลี้ยงไก่ หมู วัว ทำให้ราคาเนื้อสัตว์และไข่ไก่ปรับตัวตาม รวมถึงราคาพลังงาน'
    },

    'CAPITALCOM:LIVECATTLE': {
        name: 'Live Cattle (วัวเนื้อมีชีวิต)',
        category: 'Meat & Livestock',
        badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/30',
        iconText: 'CATL',
        symbolName: 'LIVECATTLE',
        exchange: 'CME / Capital.com',
        whatIsIt: 'วัวเนื้อขุนโตเต็มวัย น้ำหนัก 540–630 กก. พร้อมส่งเข้าโรงงานแปรรูปเนื้อ',
        tradingUnit: 'หน่วยราคาคือ US Cents ซื้อเนื้อวัวมีชีวิตได้ 0.4536 กิโลกรัม (453.6 กรัม หรือเท่ากับ 1 ปอนด์)',
        significance: 'เกณฑ์อ้างอิงราคาเนื้อวัวตลาดโลก และสะท้อนกำลังซื้อของผู้บริโภคในประเทศพัฒนาแล้ว',
        priceImpact: 'กระทบต้นทุนร้านอาหารและซูเปอร์มาร์เก็ต หากฝูงวัวลดลงจะต้องใช้เวลาหลายปีในการฟื้นตัว'
    },

    'CAPITALCOM:LEANHOGS': {
        name: 'Lean Hogs (สุกรมีชีวิต / เนื้อหมู)',
        category: 'Meat & Livestock',
        badgeClass: 'bg-pink-500/15 text-pink-400 border border-pink-500/30',
        iconText: 'HOGS',
        symbolName: 'LEANHOGS',
        exchange: 'CME / Capital.com',
        whatIsIt: 'สุกรขุนเนื้อแดงชำแหละ พร้อมส่งเข้าอุตสาหกรรมแปรรูปอาหาร (เบคอน แฮม ไส้กรอก)',
        tradingUnit: 'หน่วยราคาคือ US Cents ซื้อเนื้อหมูชำแหละได้ 0.4536 กิโลกรัม (453.6 กรัม หรือเท่ากับ 1 ปอนด์)',
        significance: 'เนื้อสัตว์ที่บริโภคมากที่สุดในจีนและยุโรป มีน้ำหนักในดัชนีเงินเฟ้อของจีนสูงมาก (Porkflation)',
        priceImpact: 'ผันผวนไวตามรอบการเลี้ยงสุกร (Pork Cycle) และการระบาดของโรคในสัตว์ (เช่น ASF)'
    },

    'CAPITALCOM:DXY': {
        name: 'US Dollar Index (ดัชนีดอลลาร์สหรัฐ)',
        category: 'Macro & Currency Benchmark',
        badgeClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
        iconText: 'DXY',
        symbolName: 'DXY',
        exchange: 'ICE / Capital.com',
        whatIsIt: 'ดัชนีวัดมูลค่าเงินดอลลาร์สหรัฐฯ (USD) เทียบกับตะกร้า 6 สกุลเงินหลักของโลก',
        tradingUnit: 'คะแนนดัชนี (ไม่ใช่สินค้าชั่งน้ำหนัก) วัดความแข็งแกร่งของเงินดอลลาร์สหรัฐ',
        significance: 'ราชาแห่งสภาพคล่องโลก ดอลลาร์แข็งค่าหมายถึงเงินทุนกำลังไหลกลับเข้าสู่สหรัฐฯ',
        priceImpact: 'มักวิ่งผกผันกับทองคำ น้ำมัน และหุ้น เมื่อดอลลาร์แข็ง สินค้าโภคภัณฑ์และตลาดเกิดใหม่มักถูกกดดัน'
    },

    'CAPITALCOM:US100': {
        name: 'NASDAQ 100 (ดัชนีแนสแด็ก 100)',
        category: 'Global Equities & Tech',
        badgeClass: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
        iconText: 'NDX',
        symbolName: 'US100',
        exchange: 'NASDAQ / Capital.com',
        whatIsIt: 'ดัชนีรวบรวม 100 บริษัทยักษ์ใหญ่เทคโนโลยีและนวัตกรรมใน NASDAQ เช่น Apple, NVDA, MSFT',
        tradingUnit: 'จุดดัชนี คำนวณจากมูลค่าเฉลี่ยถ่วงน้ำหนักของ 100 หุ้นเทคโนโลยีชั้นนำสหรัฐฯ',
        significance: 'ตัวแทนหุ้นเติบโตสูง (Growth Stocks) และกระแสเทคโนโลยี AI โลก มีผลต่อความเชื่อมั่นตลาดทุน',
        priceImpact: 'ชี้วัดสภาวะ Risk-On/Off ไวต่อการขึ้นลงของดอกเบี้ย Fed หากดอกเบี้ยพุ่ง หุ้นเทคมักถูกเทขายก่อน'
    },

    'FX:EURUSD': {
        name: 'Euro / US Dollar (ยูโรเทียบดอลลาร์)',
        category: 'Forex Major',
        badgeClass: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
        iconText: 'EUR',
        symbolName: 'EURUSD',
        exchange: 'FXCM / Global Forex',
        whatIsIt: 'คู่เงินที่มีปริมาณการซื้อขายสูงสุดในโลก (>24% ของการซื้อขายในตลาดแลกเปลี่ยนเงินตรา)',
        tradingUnit: 'จำนวนเงินดอลลาร์สหรัฐ (USD) ที่ต้องใช้แลกซื้อเงิน 1 ยูโร (1 EUR)',
        significance: 'ตัวแทนการค้าระหว่างสองขั้วเศรษฐกิจตะวันตก สะท้อนส่วนต่างดอกเบี้ยระหว่าง Fed และ ECB',
        priceImpact: 'ส่งผลต่อความสามารถในการแข่งขันส่งออก-นำเข้าของยุโรป และการเคลื่อนย้ายเงินทุนข้ามทวีป'
    },

    'FX_IDC:USDTHB': {
        name: 'US Dollar / Thai Baht (ดอลลาร์เทียบเงินบาท)',
        category: 'Forex Emerging Market',
        badgeClass: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
        iconText: 'THB',
        symbolName: 'USDTHB',
        exchange: 'Bank of Thailand / FX IDC',
        whatIsIt: 'อัตราแลกเปลี่ยนระหว่างเงินดอลลาร์สหรัฐฯ (USD) กับเงินบาทไทย (THB)',
        tradingUnit: 'จำนวนเงินบาทไทย (THB) ที่ต้องใช้แลกซื้อเงิน 1 ดอลลาร์สหรัฐ (1 USD)',
        significance: 'หัวใจของเศรษฐกิจไทยที่พึ่งพาการส่งออกและการท่องเที่ยว (คิดเป็นสัดส่วน >60% ของ GDP)',
        priceImpact: 'บาทอ่อน = เอื้อส่งออกและท่องเที่ยว แต่ทำให้น้ำมันและสินค้านำเข้าแพง ดันเงินเฟ้อในประเทศ'
    }
};
