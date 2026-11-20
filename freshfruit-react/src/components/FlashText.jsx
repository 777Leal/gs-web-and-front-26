/** Texto que "pisca" (animação flash) sempre que o valor muda. */
export default function FlashText({ children }) {
  const text = String(children);
  return <span key={text} className="animate-flash">{text}</span>;
}
