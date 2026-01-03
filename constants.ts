
import { MenuDay } from './types';

export const ADMIN_UPI_ID = "9328235517@ibl";
export const ADMIN_QR_PLACEHOLDER = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${ADMIN_UPI_ID}&pn=Maruti%20PG&cu=INR`;

// Precise recreation of the provided Maruti PG logo
export const BRAND_LOGO_SVG = `
<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <!-- Tree -->
  <path d="M190 220 Q190 100 210 50 L185 45 Q165 100 165 220 Z" fill="white"/>
  <path d="M170 180 Q140 160 145 140 Q155 125 175 135" fill="#008000"/>
  <path d="M165 140 Q130 130 135 110 Q145 100 165 110" fill="#008000"/>
  <path d="M175 100 Q145 90 150 75 Q160 65 175 75" fill="#008000"/>
  <path d="M195 70 Q180 40 200 35 Q220 40 210 70" fill="#008000"/>
  <path d="M215 100 Q235 70 250 80 Q255 100 225 110" fill="#008000"/>
  <path d="M205 145 Q245 130 255 145 Q250 165 215 160" fill="#008000"/>
  <path d="M195 185 Q225 170 235 185 Q230 205 205 200" fill="#008000"/>
  <path d="M175 210 Q155 195 150 215 Q150 230 170 230" fill="#008000"/>
  <path d="M150 190 Q120 180 125 200 Q135 215 150 205" fill="#008000"/>
  <path d="M140 160 Q110 145 120 130 Q140 120 145 150" fill="#008000"/>
  <path d="M155 120 Q130 110 140 95 Q160 90 165 115" fill="#008000"/>

  <!-- House Outlines -->
  <path d="M40 310 L160 310 L170 270 L260 145 L450 325" fill="none" stroke="black" stroke-width="12" stroke-linejoin="round"/>
  <path d="M175 325 L245 230 L430 325" fill="none" stroke="black" stroke-width="12" stroke-linejoin="round"/>
  <path d="M170 260 L135 260 L170 215 L170 260 Z" fill="black"/>
  
  <!-- Windows -->
  <rect x="255" y="195" width="15" height="40" rx="7" fill="black"/>
  <rect x="275" y="195" width="15" height="40" rx="7" fill="black"/>
  <rect x="225" y="275" width="12" height="35" rx="6" fill="black"/>
  <rect x="242" y="275" width="12" height="35" rx="6" fill="black"/>

  <!-- Bottom Line -->
  <path d="M40 310 L40 460 L450 460 L450 445" fill="none" stroke="black" stroke-width="12" stroke-linejoin="round"/>

  <!-- Text -->
  <text x="50" y="415" font-family="Impact, Charcoal, sans-serif" font-weight="bold" font-size="62">
    <tspan fill="#FF0000">MARUTI</tspan>
    <tspan fill="#008000"> PG &amp; HOSTEL</tspan>
  </text>
</svg>
`;

export const DEFAULT_MENU: MenuDay[] = [
  { day: "Monday", breakfast: "Poha & Tea", lunch: "Dal, Chawal, Mix Veg", dinner: "Paneer & Roti" },
  { day: "Tuesday", breakfast: "Paratha & Curd", lunch: "Rajma Chawal", dinner: "Aloo Gobhi & Roti" },
  { day: "Wednesday", breakfast: "Sandwich", lunch: "Chole Bhature", dinner: "Egg Curry / Malai Kofta" },
  { day: "Thursday", breakfast: "Idli Sambhar", lunch: "Kadi Pakoda & Chawal", dinner: "Bhindi Masala" },
  { day: "Friday", breakfast: "Upma", lunch: "Veg Pulao", dinner: "Chicken / Soya Chaap" },
  { day: "Saturday", breakfast: "Bread Butter", lunch: "Poori Sabzi", dinner: "Dal Makhani" },
  { day: "Sunday", breakfast: "Chole Kulche", lunch: "Special Thali", dinner: "Mix Veg & Roti" },
];

export const EXPENSE_CATEGORIES = ['VEGETABLES', 'MILK', 'GROCERIES', 'PETROL', 'OTHERS'] as const;
