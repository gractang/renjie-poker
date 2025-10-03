import MenuButton  from "./MenuButton";
export default function Controls({ onNew, newGameFlash }) {
  return (
    <div className="flex gap-2">
        <MenuButton 
          onClick={onNew}
          className={newGameFlash ? 'animate-pulse bg-[var(--color-accent)] text-[var(--color-background)]' : ''}
        >
          New Game
        </MenuButton>
    </div>
  );
}
