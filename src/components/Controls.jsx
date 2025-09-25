import MenuButton  from "./MenuButton";
export default function Controls({ onNew}) {
  return (
    <div className="flex gap-2">
        <MenuButton onClick={onNew}>New Game</MenuButton>
    </div>
  );
}
