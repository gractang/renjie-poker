import MenuButton  from "./MenuButton";
export default function Controls({ onNew, onDeal, onReveal, canDeal, canReveal }) {
  return (
    <div className="flex gap-2">
        <MenuButton onClick={onNew}>New Game</MenuButton>
        <MenuButton onClick={onDeal} disabled={!canDeal}>Deal Selected</MenuButton>
        <MenuButton onClick={onReveal} disabled={!canReveal}>Score</MenuButton>

    </div>
  );
}
