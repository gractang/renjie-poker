import MenuButton  from "./MenuButton";
export default function Controls({ onNew, onDeal, canDeal}) {
  return (
    <div className="flex gap-2">
        <MenuButton onClick={onNew}>New Game</MenuButton>
        <MenuButton onClick={onDeal} disabled={!canDeal}>Deal Selected</MenuButton>
    </div>
  );
}
