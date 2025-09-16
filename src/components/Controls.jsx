import MenuButton  from "./MenuButton";
export default function Controls({ onNew, onDeal, onReveal, canDeal, canReveal }) {
  return (
    <div className="flex gap-2">
      {/* <button className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200" onClick={onNew}>New Game</button>
      <button className="px-3 py-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={onDeal} disabled={!canDeal}>Deal Selected</button>
      <button className="px-3 py-1 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              onClick={onReveal} disabled={!canReveal}>Reveal &amp; Score</button> */}

        <MenuButton onClick={onNew}>New Game</MenuButton>
        <MenuButton onClick={onDeal} disabled={!canDeal}>Deal Selected</MenuButton>
        <MenuButton onClick={onReveal} disabled={!canReveal}>Score</MenuButton>

    </div>
  );
}
