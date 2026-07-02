import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { colors } from "./theme";

// Beats abstratos (custom)
import { Scene01Opening } from "./scenes/Scene01Opening";
import { Scene03Headline } from "./scenes/Scene03Headline";
import { Scene13Keyword2 } from "./scenes/Scene13Keyword2";
import { Scene15Outro } from "./scenes/Scene15Outro";
// Telas reais do produto (componentes reais do app)
import { SceneResumo } from "./scenes/SceneResumo";
import { SceneTransacao } from "./scenes/SceneTransacao";
import { SceneCartoes } from "./scenes/SceneCartoes";
import { SceneAnalises } from "./scenes/SceneAnalises";
import { SceneObjetivos } from "./scenes/SceneObjetivos";

type SceneDef = { Comp: React.FC; d: number };

// Roteiro revisado @30fps — telas reais no miolo, beats abstratos nas pontas.
const SCENES: SceneDef[] = [
  { Comp: Scene01Opening, d: 75 }, //  Abertura da marca
  { Comp: Scene03Headline, d: 90 }, //  Headline "do cadê meu dinheiro? ao controle total"
  { Comp: SceneResumo, d: 190 }, //  Dashboard real (Resumo)
  { Comp: SceneTransacao, d: 165 }, //  Adicionar transação (modal real)
  { Comp: SceneCartoes, d: 140 }, //  Meus cartões (visual real)
  { Comp: SceneAnalises, d: 190 }, //  Análises (recharts reais)
  { Comp: SceneObjetivos, d: 150 }, //  Objetivos (progresso real)
  { Comp: Scene13Keyword2, d: 90 }, //  "Fim do mês sem surpresas"
  { Comp: Scene15Outro, d: 150 }, //  Encerramento + CTA
];

const TRANSITION = 18;
// Movimento horizontal (slide) ao entrar em telas de produto; fade nos demais.
const SLIDE_GAPS = new Set([2, 4, 6]);

export const FICKER_DURATION =
  SCENES.reduce((acc, s) => acc + s.d, 0) - (SCENES.length - 1) * TRANSITION;

export const FickerVideo: React.FC = () => {
  const children: React.ReactNode[] = [];

  SCENES.forEach((s, i) => {
    if (i > 0) {
      children.push(
        <TransitionSeries.Transition
          key={`t-${i}`}
          timing={linearTiming({ durationInFrames: TRANSITION })}
          presentation={SLIDE_GAPS.has(i) ? slide({ direction: "from-right" }) : fade()}
        />
      );
    }
    children.push(
      <TransitionSeries.Sequence key={`s-${i}`} durationInFrames={s.d}>
        <s.Comp />
      </TransitionSeries.Sequence>
    );
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.cream }}>
      <TransitionSeries>{children}</TransitionSeries>
    </AbsoluteFill>
  );
};
