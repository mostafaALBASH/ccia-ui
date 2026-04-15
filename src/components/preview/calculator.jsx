"use client";

import { useState, useEffect, useCallback } from "react";

export const generatePrompt = `
Generate a fully functional, beautifully styled calculator component in React with the following requirements:

**Functionality:**
- Display showing current input and the running expression (two-line display: expression on top, result below)
- Digit buttons: 0-9
- Operations: addition (+), subtraction (-), multiplication (*), division (/)
- Additional operations: percentage (%), plus/minus toggle, decimal point (.)
- Scientific: sin, cos, tan (degrees), sqrt, log, ln
- Action buttons: Clear (AC), backspace, and equals (=)
- Keyboard support: number keys, operators, Enter for equals, Escape for clear, Backspace for delete
- Prevent division by zero with a friendly error message
- Chain calculations (e.g., 5 + 3 = 8, then x 2 = 16)

**Design & Styling (Tailwind CSS):**
- Dark-themed calculator body with gradient background (slate-900 to slate-800)
- Rounded corners, soft drop shadow, glass-morphism effect on the card
- Display area: dark background (slate-950), right-aligned text, expression in muted gray, result in large white bold font
- Button grid: 4 columns, generous padding, rounded buttons with hover and active press animations (scale-95 on click)
- Color coding: Digit buttons slate-700, Operator buttons amber-500, Utility buttons slate-500, Equals amber-500 gradient, Backspace rose-600, Scientific buttons indigo-600
- Smooth transition animations on all buttons. Responsive sizing.

**Structure:**
- Single /App.jsx file as entry point
- Use React useState and useEffect hooks only
- Clean, readable code with clear separation of display logic and calculation logic

Please provide the complete code.`;

const DEG_TO_RAD = Math.PI / 180;

function calculate(a, op, b) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  switch (op) {
    case "+": return numA + numB;
    case "-": return numA - numB;
    case "*": return numA * numB;
    case "/":
      if (numB === 0) return "Error";
      return numA / numB;
    default: return numB;
  }
}

function applyScientific(fn, value) {
  const num = parseFloat(value);
  if (isNaN(num)) return "Error";
  switch (fn) {
    case "sin":  return Math.sin(num * DEG_TO_RAD);
    case "cos":  return Math.cos(num * DEG_TO_RAD);
    case "tan":  return Math.tan(num * DEG_TO_RAD);
    case "sqrt": return num < 0 ? "Error" : Math.sqrt(num);
    case "log":  return num <= 0 ? "Error" : Math.log10(num);
    case "ln":   return num <= 0 ? "Error" : Math.log(num);
    default: return "Error";
  }
}

function formatNumber(num) {
  if (num === "Error") return "Error";
  const parsed = parseFloat(num);
  if (isNaN(parsed)) return "0";
  const fixed = parseFloat(parsed.toFixed(10));
  const str = fixed.toString();
  if (str.includes(".")) {
    const [int, dec] = str.split(".");
    return `${parseInt(int).toLocaleString()}.${dec}`;
  }
  return fixed.toLocaleString();
}

const STANDARD_BUTTONS = [
  { label: "AC", type: "utility" },
  { label: "±",  type: "utility" },
  { label: "%",  type: "utility" },
  { label: "÷",  type: "operator", op: "/" },
  { label: "7",  type: "digit" },
  { label: "8",  type: "digit" },
  { label: "9",  type: "digit" },
  { label: "×",  type: "operator", op: "*" },
  { label: "4",  type: "digit" },
  { label: "5",  type: "digit" },
  { label: "6",  type: "digit" },
  { label: "−",  type: "operator", op: "-" },
  { label: "1",  type: "digit" },
  { label: "2",  type: "digit" },
  { label: "3",  type: "digit" },
  { label: "+",  type: "operator", op: "+" },
  { label: "⌫",  type: "backspace" },
  { label: "0",  type: "digit" },
  { label: ".",  type: "digit" },
  { label: "=",  type: "equals" },
];

const SCIENTIFIC_BUTTONS = [
  { label: "sin",  type: "scientific", fn: "sin" },
  { label: "cos",  type: "scientific", fn: "cos" },
  { label: "tan",  type: "scientific", fn: "tan" },
  { label: "√",    type: "scientific", fn: "sqrt" },
  { label: "log",  type: "scientific", fn: "log" },
  { label: "ln",   type: "scientific", fn: "ln" },
];

const buttonClass = {
  digit:      "bg-slate-700 hover:bg-slate-600 text-white",
  operator:   "bg-amber-500 hover:bg-amber-400 text-white",
  utility:    "bg-slate-500 hover:bg-slate-400 text-white",
  equals:     "bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-white shadow-lg shadow-amber-900/40",
  backspace:  "bg-rose-600 hover:bg-rose-500 text-white",
  scientific: "bg-indigo-600 hover:bg-indigo-500 text-white text-sm",
};

/**
 * @param {{ autoRun?: Array<{display:string,expression?:string,operator?:string|null,operand?:string|null,waiting?:boolean,evaluated?:boolean,delay?:number}>|null }} props
 */
export default function Calculator({ autoRun = null }) {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [operator, setOperator] = useState(null);
  const [operand, setOperand] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);

  // Animate through a pre-computed sequence of frames on mount
  useEffect(() => {
    if (!autoRun || autoRun.length === 0) return;
    let i = 0;
    const next = () => {
      if (i >= autoRun.length) return;
      const frame = autoRun[i++];
      setDisplay(frame.display);
      setExpression(frame.expression ?? "");
      if (frame.operator    !== undefined) setOperator(frame.operator);
      if (frame.operand     !== undefined) setOperand(frame.operand);
      if (frame.waiting     !== undefined) setWaitingForOperand(frame.waiting);
      if (frame.evaluated   !== undefined) setJustEvaluated(frame.evaluated);
      setTimeout(next, frame.delay ?? 700);
    };
    const t = setTimeout(next, 600);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDigit = useCallback((digit) => {
    if (display === "Error") {
      setDisplay(digit);
      setExpression(digit);
      setJustEvaluated(false);
      return;
    }
    if (digit === "." && display.includes(".")) return;
    if (waitingForOperand) {
      setDisplay(digit === "." ? "0." : digit);
      setWaitingForOperand(false);
      setJustEvaluated(false);
      return;
    }
    if (justEvaluated) {
      setDisplay(digit);
      setExpression(digit);
      setOperator(null);
      setOperand(null);
      setJustEvaluated(false);
      return;
    }
    const next = display === "0" && digit !== "." ? digit : display + digit;
    setDisplay(next);
  }, [display, waitingForOperand, justEvaluated]);

  const handleOperator = useCallback((op, label) => {
    if (display === "Error") return;
    if (operator && !waitingForOperand) {
      const result = calculate(operand, operator, display);
      if (result === "Error") { setDisplay("Error"); setExpression("Error"); return; }
      const formatted = parseFloat(result.toFixed(10)).toString();
      setDisplay(formatted);
      setOperand(formatted);
      setExpression(`${formatted} ${label}`);
    } else {
      setOperand(display);
      setExpression(`${display} ${label}`);
    }
    setOperator(op);
    setWaitingForOperand(true);
    setJustEvaluated(false);
  }, [display, operator, operand, waitingForOperand]);

  const handleEquals = useCallback(() => {
    if (!operator || display === "Error") return;
    const result = calculate(operand, operator, display);
    const opLabel = STANDARD_BUTTONS.find(b => b.op === operator)?.label ?? operator;
    const expr = `${operand} ${opLabel} ${display} =`;
    if (result === "Error") {
      setDisplay("Error");
      setExpression(expr);
    } else {
      const formatted = parseFloat(result.toFixed(10)).toString();
      setDisplay(formatted);
      setExpression(expr);
      setOperand(formatted);
    }
    setOperator(null);
    setWaitingForOperand(false);
    setJustEvaluated(true);
  }, [operator, operand, display]);

  const handleClear = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setOperator(null);
    setOperand(null);
    setWaitingForOperand(false);
    setJustEvaluated(false);
  }, []);

  const handleBackspace = useCallback(() => {
    if (display === "Error" || waitingForOperand || justEvaluated) {
      handleClear();
      return;
    }
    const next = display.length > 1 ? display.slice(0, -1) : "0";
    setDisplay(next);
  }, [display, waitingForOperand, justEvaluated, handleClear]);

  const handleToggleSign = useCallback(() => {
    if (display === "Error") return;
    setDisplay((parseFloat(display) * -1).toString());
  }, [display]);

  const handlePercent = useCallback(() => {
    if (display === "Error") return;
    setDisplay((parseFloat(display) / 100).toString());
  }, [display]);

  const handleScientific = useCallback((fn) => {
    if (display === "Error") return;
    const result = applyScientific(fn, display);
    const expr = `${fn}(${display})`;
    if (result === "Error") {
      setDisplay("Error");
      setExpression(expr);
    } else {
      const formatted = parseFloat(result.toFixed(10)).toString();
      setExpression(expr);
      setDisplay(formatted);
      setJustEvaluated(true);
    }
  }, [display]);

  const handleButton = useCallback((btn) => {
    if (btn.type === "digit")      return handleDigit(btn.label);
    if (btn.type === "operator")   return handleOperator(btn.op, btn.label);
    if (btn.type === "equals")     return handleEquals();
    if (btn.type === "backspace")  return handleBackspace();
    if (btn.type === "scientific") return handleScientific(btn.fn);
    if (btn.type === "utility") {
      if (btn.label === "AC") return handleClear();
      if (btn.label === "±")  return handleToggleSign();
      if (btn.label === "%")  return handlePercent();
    }
  }, [handleDigit, handleOperator, handleEquals, handleClear, handleToggleSign, handlePercent, handleBackspace, handleScientific]);

  useEffect(() => {
    const opLabelMap = { "+": "+", "-": "−", "*": "×", "/": "÷" };
    const handler = (e) => {
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      else if (e.key === ".") handleDigit(".");
      else if (["+", "-", "*", "/"].includes(e.key)) handleOperator(e.key, opLabelMap[e.key]);
      else if (e.key === "Enter" || e.key === "=") handleEquals();
      else if (e.key === "Escape") handleClear();
      else if (e.key === "Backspace") handleBackspace();
      else if (e.key === "%") handlePercent();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleDigit, handleOperator, handleEquals, handleClear, handleBackspace, handlePercent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-80 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10 backdrop-blur-sm bg-white/5">
        {/* Display */}
        <div className="bg-slate-950 px-6 pt-8 pb-4 text-right">
          <p className="text-slate-400 text-sm h-5 truncate font-mono tracking-wide">
            {expression || "\u00a0"}
          </p>
          <p className="text-white text-5xl font-light mt-1 truncate tracking-tight">
            {formatNumber(display)}
          </p>
        </div>

        {/* Scientific Row */}
        <div className="grid grid-cols-6 gap-px bg-slate-700/30 px-px pt-px">
          {SCIENTIFIC_BUTTONS.map((btn) => (
            <button
              key={btn.label}
              onClick={() => handleButton(btn)}
              className={`${buttonClass.scientific} h-10 font-medium transition-all duration-100 active:scale-95 focus:outline-none`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Standard Buttons */}
        <div className="grid grid-cols-4 gap-px bg-slate-700/30 p-px">
          {STANDARD_BUTTONS.map((btn) => (
            <button
              key={btn.label}
              onClick={() => handleButton(btn)}
              className={`
                ${buttonClass[btn.type]}
                h-16 text-xl font-medium
                transition-all duration-100 active:scale-95
                focus:outline-none
              `}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
