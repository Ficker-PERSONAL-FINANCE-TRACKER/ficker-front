# Ficker — Vídeo de apresentação (Remotion)

Motion design de apresentação do **Ficker**, renderizado com [Remotion](https://remotion.dev).
As telas de produto usam **os componentes reais da aplicação** (antd + recharts +
`MyCategoriesList`, `LastTransactionsList`, gráficos, formulários, visual de cartão…), para
ficar idêntico à produção. Os "beats" abstratos (abertura, headline, frase de valor, CTA) são
compostos sob medida.

> Versão **sem locução** — apenas animações. Veja o fim deste arquivo para adicionar narração.

- **Formato:** 1920×1080, 30fps · ~36s · Composição `FickerPromo`

## Como usar (rodar da RAIZ do projeto)

O Remotion está integrado ao app Next para reaproveitar `node_modules`, o alias `@/` e a
pasta `public/`. Use os scripts do `package.json` raiz:

```bash
npm install            # (uma vez) instala app + Remotion
npm run video:studio   # abre o Remotion Studio (preview interativo)
npm run video:render   # renderiza out/ficker-promo.mp4
```

Render de um frame estático (revisar uma cena):

```bash
npx remotion still remotion/src/index.ts FickerPromo out/frame.png --frame=209
```

## Roteiro (revisado)

| # | Cena | Componentes reais? |
|---|------|--------------------|
| 1 | Abertura da marca | custom |
| 2 | Headline "do cadê meu dinheiro? ao controle total" | custom |
| 3 | **Resumo** (dashboard) | ✅ `MyCategoriesList`, `LastTransactionsList`, recharts, sidebar/ícones reais |
| 4 | **Adicionar transação** (modal) | ✅ antd `Form/DatePicker/Select/InputNumber` + `currencyFormatter` real |
| 5 | **Meus cartões** | ✅ visual de cartão real (gradiente + bandeira) |
| 6 | **Análises** | ✅ `PlannedSpendingByRealSpendingChart` real + recharts |
| 7 | **Objetivos** | ✅ antd `Progress`/`Tag` |
| 8 | Frase de valor "Fim do mês sem surpresas" | custom |
| 9 | Encerramento + CTA | custom |

Ordem e durações ficam em `SCENES` (`src/FickerVideo.tsx`); a duração total é recalculada.

## Arquitetura da integração

- **`remotion.config.ts`** (raiz): override do webpack que
  1. habilita SCSS (`@remotion/enable-scss`);
  2. cria o alias `@/` → `src/`;
  3. faz *shim* de APIs do Next (`next/image`, `next/link`, `next/navigation`, `next/font/google`) — ver `remotion/shims/`;
  4. copia `public/` para a raiz do bundle (`copy-webpack-plugin`) — os componentes reais usam caminhos absolutos como `/icons/...` e `/logo.png`, que o Remotion serve em `/public/...`.
- **`remotion/src/components/AntdProviders.tsx`**: `StyleProvider` (cssinjs) + `ConfigProvider` (tema roxo + fonte **Manrope**, a mesma do app).

### Notas importantes
- **Animações de terceiros não sincronizam com os frames do Remotion.** Por isso:
  - o `AnimatedNumber` do app (usa `requestAnimationFrame`) é substituído por uma versão frame-síncrona do Remotion;
  - os gráficos recharts são renderizados com `isAnimationActive={false}` (o gráfico de evolução foi replicado localmente com essa flag; o de barras já vinha assim no app). A revelação é feita pelo Remotion.
- **Assets:** vêm de `public/` real (via `copy-webpack-plugin`). Não há duplicação.

## Próximos passos: locução e trilha

1. Coloque os áudios em `public/` (ex.: `public/trilha.mp3`).
2. Em `FickerVideo.tsx`, dentro do `AbsoluteFill`:
   ```tsx
   import { Audio, staticFile } from "remotion";
   <Audio src={staticFile("trilha.mp3")} volume={0.4} />
   ```
3. Para falas por cena, envolva cada `<Audio>` em `<Sequence from={frameInicial}>` (os frames iniciais estão comentados em `FickerVideo.tsx`).
