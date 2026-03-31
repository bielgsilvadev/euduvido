/**
 * Altura “lógica” da tab bar **antes** do inset inferior: cabe ícone central 44pt + rótulos + dot,
 * alinhada ao ritmo 8pt (não ao default 49px do React Navigation, que cortava o texto).
 */
export const TAB_BAR_CONTENT_HEIGHT = 72;

export function tabBarBottomInset(safeAreaBottom: number): number {
  return safeAreaBottom;
}

/** Altura total da tab bar (para posicionar FABs e para o React Navigation). */
export function tabBarOuterHeight(safeAreaBottom: number): number {
  return TAB_BAR_CONTENT_HEIGHT + tabBarBottomInset(safeAreaBottom);
}

/** Padding no fim de listas por cima da tab bar (folga mínima). */
export function tabListBottomPadding(safeAreaBottom: number): number {
  return tabBarOuterHeight(safeAreaBottom) + 6;
}

/** Folga extra por cima do FAB de registo (vinho), para não cobrir conteúdo ao fundo do scroll. */
export const TAB_BAR_WINE_FAB_CLEARANCE = 52;
