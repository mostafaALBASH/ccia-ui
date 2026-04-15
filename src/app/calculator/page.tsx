"use client";

import Calculator from "@/components/preview/calculator";

// Precomputed state frames for: cos(90) - sin(45)
// cos(90°) = 0,  sin(45°) = 0.7071067812,  result = -0.7071067812
const COS90_MINUS_SIN45 = [
  // Enter 9
  { display: "9",            expression: "",          operator: null, operand: null, waiting: false, evaluated: false, delay: 500 },
  // Enter 0 → 90
  { display: "90",           expression: "",          delay: 600 },
  // Press cos → cos(90°) = 0
  { display: "0",            expression: "cos(90)",   operator: null, operand: null, waiting: false, evaluated: true,  delay: 800 },
  // Press − operator
  { display: "0",            expression: "0 −",       operator: "-",  operand: "0",  waiting: true,  evaluated: false, delay: 600 },
  // Enter 4
  { display: "4",            expression: "0 −",       operator: "-",  operand: "0",  waiting: false, evaluated: false, delay: 500 },
  // Enter 5 → 45
  { display: "45",           expression: "0 −",       operator: "-",  operand: "0",  waiting: false, evaluated: false, delay: 600 },
  // Press sin → sin(45°) = 0.7071067812
  { display: "0.7071067812", expression: "sin(45)",   operator: "-",  operand: "0",  waiting: false, evaluated: true,  delay: 800 },
  // Press = → 0 - 0.7071067812 = -0.7071067812
  { display: "-0.7071067812", expression: "0 − 0.7071067812 =", operator: null, operand: "-0.7071067812", waiting: false, evaluated: true, delay: 600 },
];

export default function CalculatorPage() {
  return <Calculator autoRun={COS90_MINUS_SIN45} />;
}
