import type { BadgeDefinition } from '@/types/models';

/**
 * Catálogo completo de conquistas Eu Duvido! (ids estáveis = `public.badges.id` no Supabase).
 * Desbloqueio real virá de triggers/jobs; a app só exibe o catálogo + `user_badges`.
 */
export const BADGE_SEED_CATALOG: BadgeDefinition[] = [
  // —— Duelos e vitórias ——
  { id: 'duel_first', name: 'Primeiro duelo', description: 'Criou a primeira aposta P2P.', icon_key: 'flag' },
  { id: 'duel_five', name: 'Cinco na mesa', description: 'Criou 5 duelos.', icon_key: 'flag' },
  { id: 'duel_ten', name: 'Dez apostas', description: 'Criou 10 duelos.', icon_key: 'flag' },
  { id: 'duel_twenty_five', name: 'Veterano', description: 'Criou 25 duelos.', icon_key: 'trophy' },
  { id: 'win_first', name: 'Primeira vitória', description: 'Ganhou o primeiro duelo resolvido.', icon_key: 'trophy' },
  { id: 'win_five', name: 'Cinco vitórias', description: '5 duelos ganhos.', icon_key: 'trophy' },
  { id: 'win_ten', name: 'Dez vitórias', description: '10 duelos ganhos.', icon_key: 'trophy' },
  { id: 'win_twenty_five', name: 'Colecionador de vitórias', description: '25 duelos ganhos.', icon_key: 'medal' },
  { id: 'win_fifty', name: 'Imbatível', description: '50 duelos ganhos.', icon_key: 'medal' },
  { id: 'streak_wins_3', name: 'Sequência quente', description: '3 vitórias seguidas.', icon_key: 'flame' },
  { id: 'streak_wins_5', name: 'Embalado', description: '5 vitórias seguidas.', icon_key: 'flame' },
  { id: 'streak_wins_10', name: 'Máquina', description: '10 vitórias seguidas.', icon_key: 'flash' },

  // —— Dinheiro e coragem ——
  { id: 'bet_bold_100', name: 'Aposta firme', description: 'Duelo com R$ 100+ por lado.', icon_key: 'cash' },
  { id: 'bet_bold_500', name: 'Alto risco', description: 'Duelo com R$ 500+ por lado.', icon_key: 'cash' },
  { id: 'open_challenge_first', name: 'Portas abertas', description: 'Primeira aposta aberta à comunidade.', icon_key: 'globe' },
  { id: 'open_challenge_five', name: 'Desafio público', description: '5 apostas abertas criadas.', icon_key: 'globe' },

  // —— Árbitro ——
  { id: 'arbiter_first', name: 'Juiz estreante', description: 'Foi árbitro pela primeira vez.', icon_key: 'scale' },
  { id: 'arbiter_five', name: 'Árbitro experiente', description: 'Julgou 5 duelos.', icon_key: 'scale' },
  { id: 'arbiter_ten', name: 'Justiça em cena', description: 'Julgou 10 duelos.', icon_key: 'shield' },

  // —— Comunidade e social ——
  { id: 'cheer_first', name: 'Eu acredito!', description: 'Primeira reação de apoio num duelo.', icon_key: 'heart' },
  { id: 'cheer_fifty', name: 'Torcedor', description: '50 reações de apoio.', icon_key: 'heart' },
  { id: 'doubt_first', name: 'Eu duvido!', description: 'Primeira reação de dúvida (no bom sentido).', icon_key: 'flash' },
  { id: 'doubt_twenty_five', name: 'Cético social', description: '25 reações “duvido”.', icon_key: 'flash' },
  { id: 'comment_first', name: 'Primeira palavra', description: 'Primeiro comentário num duelo.', icon_key: 'chat' },
  { id: 'comment_ten', name: 'Debatedor', description: '10 comentários na comunidade.', icon_key: 'chat' },
  { id: 'followers_ten', name: 'Começando audiência', description: '10 seguidores.', icon_key: 'people' },
  { id: 'followers_fifty', name: 'Influência', description: '50 seguidores.', icon_key: 'people' },
  { id: 'followers_hundred', name: 'Referência', description: '100 seguidores.', icon_key: 'star' },

  // —— Grupos (comunidades) ——
  { id: 'community_first', name: 'Entrou na roda', description: 'Participou da primeira comunidade.', icon_key: 'people' },
  { id: 'community_three', name: 'Três mesas', description: 'Está em 3 comunidades.', icon_key: 'people' },
  { id: 'community_champ', name: 'Campeão do grupo', description: 'Primeiro lugar no ranking de uma comunidade.', icon_key: 'trophy' },

  // —— Perfil e transparência ——
  { id: 'profile_ready', name: 'Perfil no ponto', description: 'Foto e nome para a comunidade reconhecer.', icon_key: 'person' },
  { id: 'bio_writer', name: 'Quem sou eu', description: 'Preencheu a bio.', icon_key: 'person' },

  // —— Ranking e reputação ——
  { id: 'rep_hundred', name: 'Credível', description: '100 pontos de reputação.', icon_key: 'analytics' },
  { id: 'rep_five_hundred', name: 'Respeitado', description: '500 de reputação.', icon_key: 'analytics' },
  { id: 'rep_thousand', name: 'Nome na praça', description: '1000 de reputação.', icon_key: 'ribbon' },
  { id: 'top_global_once', name: 'Topo do mundo', description: 'Liderou o ranking global.', icon_key: 'ribbon' },

  // —— Hábito / provas (duelos comportamentais) ——
  { id: 'proof_streak_7', name: 'Uma semana firme', description: '7 dias seguidos com prova em duelo.', icon_key: 'flame' },
  { id: 'proof_streak_30', name: 'Mês na régua', description: '30 dias seguidos de provas.', icon_key: 'flash' },
  { id: 'proof_marathon', name: 'Prova final', description: 'Completou duelo com prova única no fim.', icon_key: 'medal' },

  // —— Especiais ——
  { id: 'early_adopter', name: 'Cedo demais', description: 'Entre os primeiros na arena.', icon_key: 'star' },
  { id: 'night_owl_duel', name: 'Duelo da madrugada', description: 'Criou ou aceitou duelo após 22h.', icon_key: 'moon' },
  { id: 'weekend_bet', name: 'Fim de semana no jogo', description: 'Duelo com marco num sábado ou domingo.', icon_key: 'calendar' },
];
