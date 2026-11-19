import { useId, type ReactElement } from 'react';
import type { MascotId } from '../../types';

/*
 * Flat SVG renditions of the OLAA buddies, drawn on a 1024×1024 canvas to match the
 * supplied artwork: closed happy eyes, blush cheeks, white "stitch" lines and spiral spots.
 */

const INK = '#1f2a3a';
const CREAM = '#fae8c4';

function Eye({ x, y, w = 18 }: { x: number; y: number; w?: number }) {
  return (
    <path
      d={`M${x - w} ${y + 12} Q${x} ${y - 14} ${x + w} ${y + 12}`}
      fill="none"
      stroke={INK}
      strokeWidth={11}
      strokeLinecap="round"
    />
  );
}

function Stitch({ d }: { d: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke="#fff"
      strokeWidth={8}
      strokeLinecap="round"
      strokeDasharray="14 16"
    />
  );
}

function Spiral({
  cx,
  cy,
  rx,
  ry,
  fill,
  ring,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  fill: string;
  ring: string;
}) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} />
      {[0.72, 0.46, 0.2].map((k) => (
        <ellipse
          key={k}
          cx={cx}
          cy={cy}
          rx={rx * k}
          ry={ry * k}
          fill="none"
          stroke={ring}
          strokeWidth={5}
        />
      ))}
    </g>
  );
}

function Bear() {
  const body = '#b86b3a';
  const dark = '#a0562f';
  const pink = '#f5b887';
  return (
    <>
      <circle cx={335} cy={180} r={88} fill={body} />
      <circle cx={710} cy={180} r={88} fill={body} />
      <circle cx={340} cy={187} r={45} fill={pink} />
      <circle cx={705} cy={187} r={45} fill={pink} />
      <circle cx={265} cy={780} r={42} fill={body} />
      <path
        d="M270 830 C 240 600, 300 420, 420 380 L 640 380 C 720 450, 750 650, 748 840 C 748 880, 700 890, 640 890 L 330 890 C 290 890, 272 870, 270 830 Z"
        fill={body}
      />
      <ellipse cx={521} cy={320} rx={222} ry={182} fill={body} />
      <ellipse cx={595} cy={710} rx={97} ry={160} fill={CREAM} />
      <ellipse cx={618} cy={575} rx={48} ry={73} fill={dark} transform="rotate(-15 618 575)" />
      <ellipse cx={561} cy={377} rx={114} ry={82} fill={CREAM} />
      <ellipse cx={565} cy={345} rx={34} ry={24} fill={INK} />
      <path
        d="M530 402 Q562 402 565 372 Q568 402 600 402"
        fill="none"
        stroke={INK}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Eye x={431} y={292} />
      <Eye x={624} y={292} />
      <ellipse cx={380} cy={365} rx={33} ry={28} fill="#d97a68" />
      <ellipse cx={703} cy={365} rx={33} ry={28} fill="#d97a68" />
      <ellipse cx={430} cy={888} rx={112} ry={43} fill={dark} />
      <ellipse cx={640} cy={888} rx={112} ry={43} fill={dark} />
      <ellipse cx={431} cy={892} rx={50} ry={20} fill={pink} />
      <ellipse cx={641} cy={892} rx={50} ry={20} fill={pink} />
      <Stitch d="M333 258 Q318 300 330 345" />
      <Stitch d="M280 565 Q265 650 280 745" />
    </>
  );
}

function Cat() {
  const body = '#e87e2d';
  const stripe = '#d0661d';
  const pink = '#f5b887';
  return (
    <>
      <path
        d="M300 550 C 220 590 180 700 250 790 C 290 840 350 850 400 850"
        fill="none"
        stroke={body}
        strokeWidth={70}
        strokeLinecap="round"
      />
      <path
        d="M210 600 Q196 630 203 660"
        fill="none"
        stroke={stripe}
        strokeWidth={20}
        strokeLinecap="round"
      />
      <path
        d="M410 100 L560 210 L395 270 Z"
        fill={body}
        stroke={body}
        strokeWidth={30}
        strokeLinejoin="round"
      />
      <path
        d="M765 100 L630 210 L790 285 Z"
        fill={body}
        stroke={body}
        strokeWidth={30}
        strokeLinejoin="round"
      />
      <path
        d="M445 148 L505 200 L440 222 Z"
        fill={pink}
        stroke={pink}
        strokeWidth={14}
        strokeLinejoin="round"
      />
      <path
        d="M735 148 L680 200 L745 230 Z"
        fill={pink}
        stroke={pink}
        strokeWidth={14}
        strokeLinejoin="round"
      />
      <path
        d="M345 760 C 330 560, 380 450, 450 420 L 740 420 C 810 520, 840 650, 830 820 C 828 880, 790 895, 740 895 L 400 895 C 360 895, 348 830, 345 760 Z"
        fill={body}
      />
      <ellipse cx={589} cy={345} rx={212} ry={135} fill={body} />
      {[551, 589, 626].map((x) => (
        <line
          key={x}
          x1={x}
          y1={225}
          x2={x}
          y2={262}
          stroke={stripe}
          strokeWidth={16}
          strokeLinecap="round"
        />
      ))}
      {[588, 668, 748].map((y) => (
        <line
          key={y}
          x1={362}
          y1={y}
          x2={428}
          y2={y + 12}
          stroke={stripe}
          strokeWidth={20}
          strokeLinecap="round"
        />
      ))}
      <ellipse cx={694} cy={725} rx={87} ry={158} fill={CREAM} />
      <ellipse cx={440} cy={898} rx={90} ry={34} fill={stripe} />
      <ellipse cx={679} cy={898} rx={93} ry={34} fill={CREAM} />
      <Eye x={510} y={348} />
      <Eye x={668} y={348} />
      <ellipse cx={451} cy={402} rx={32} ry={27} fill="#ec7f73" />
      <ellipse cx={727} cy={402} rx={32} ry={27} fill="#ec7f73" />
      <path
        d="M574 388 L604 388 L589 408 Z"
        fill="#c8604d"
        stroke="#c8604d"
        strokeWidth={8}
        strokeLinejoin="round"
      />
      <path
        d="M556 435 Q589 440 589 410 Q589 440 622 435"
        fill="none"
        stroke={INK}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <g stroke="#5a6470" strokeWidth={7} strokeLinecap="round">
        <line x1={356} y1={374} x2={430} y2={384} />
        <line x1={364} y1={409} x2={430} y2={407} />
        <line x1={748} y1={384} x2={822} y2={374} />
        <line x1={748} y1={407} x2={814} y2={409} />
      </g>
      <Stitch d="M435 255 Q412 290 408 330" />
      <Stitch d="M798 555 Q815 610 810 670" />
    </>
  );
}

function Dog() {
  const body = '#f2c94c';
  const shade = '#ddb03b';
  const blue = '#2d80bb';
  return (
    <>
      <path
        d="M135 330 Q100 400 130 450 Q160 490 230 500"
        fill="none"
        stroke={body}
        strokeWidth={55}
        strokeLinecap="round"
      />
      {[244, 523].map((x) => (
        <rect key={x} x={x} y={600} width={77} height={188} rx={38} fill={shade} />
      ))}
      {[350, 619].map((x) => (
        <rect key={x} x={x} y={600} width={77} height={188} rx={38} fill={body} />
      ))}
      {[252, 358, 531, 627].map((x) => (
        <rect key={x} x={x} y={755} width={61} height={33} rx={16} fill={CREAM} />
      ))}
      <rect x={191} y={379} width={510} height={288} rx={140} fill={body} />
      <Spiral cx={330} cy={465} rx={90} ry={60} fill={blue} ring="#6aafde" />
      <ellipse cx={744} cy={360} rx={135} ry={117} fill={body} />
      <ellipse cx={835} cy={412} rx={92} ry={62} fill={CREAM} />
      <ellipse cx={903} cy={396} rx={29} ry={21} fill={INK} />
      <path
        d="M802 450 Q840 482 884 443"
        fill="none"
        stroke={INK}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <ellipse cx={675} cy={335} rx={52} ry={102} fill={blue} transform="rotate(22 675 335)" />
      <Eye x={783} y={336} w={16} />
      <ellipse cx={768} cy={400} rx={24} ry={21} fill="#f09591" />
      <Stitch d="M435 407 Q530 390 620 410" />
      <Stitch d="M696 270 Q750 255 795 272" />
    </>
  );
}

function Elephant() {
  const body = '#6bb1d8';
  const dark = '#3f8dbe';
  const light = '#a7d2ea';
  return (
    <>
      <path
        d="M135 420 Q100 480 112 560"
        fill="none"
        stroke={dark}
        strokeWidth={22}
        strokeLinecap="round"
      />
      <ellipse cx={113} cy={573} rx={19} ry={29} fill={dark} />
      {[198, 506].map((x) => (
        <rect key={x} x={x} y={590} width={96} height={190} rx={46} fill={dark} />
      ))}
      {[304, 612].map((x) => (
        <rect key={x} x={x} y={590} width={96} height={190} rx={46} fill={body} />
      ))}
      {[222, 328, 530, 636].map((x) => (
        <rect key={x} x={x} y={756} width={48} height={24} rx={12} fill={CREAM} />
      ))}
      <ellipse cx={430} cy={490} rx={300} ry={193} fill={body} />
      <path
        d="M850 400 Q930 540 860 690"
        fill="none"
        stroke={body}
        strokeWidth={110}
        strokeLinecap="round"
      />
      <circle cx={815} cy={690} r={52} fill={body} />
      <circle cx={728} cy={385} r={143} fill={body} />
      <ellipse cx={640} cy={428} rx={88} ry={121} fill={dark} transform="rotate(10 640 428)" />
      <ellipse cx={645} cy={433} rx={52} ry={83} fill={light} transform="rotate(10 645 433)" />
      <path
        d="M815 460 Q860 490 845 545"
        fill="none"
        stroke={CREAM}
        strokeWidth={26}
        strokeLinecap="round"
      />
      <Eye x={770} y={350} w={16} />
      <ellipse cx={785} cy={416} rx={29} ry={25} fill="#8b86c6" />
      <path
        d="M732 472 Q758 492 786 470"
        fill="none"
        stroke={INK}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Spiral cx={313} cy={472} rx={67} ry={53} fill={light} ring="#e6f3fa" />
      <Stitch d="M235 385 Q380 330 545 357" />
      <Stitch d="M668 290 Q720 262 772 275" />
    </>
  );
}

function Fish({ uid }: { uid: string }) {
  const body = '#f2c94c';
  const blue = '#2d80bb';
  const clip = `fish-body-${uid}`;
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <ellipse cx={505} cy={522} rx={275} ry={208} />
        </clipPath>
      </defs>
      <path
        d="M100 380 Q92 358 125 372 L265 490 L265 560 L125 672 Q92 688 98 650 Q128 520 100 380 Z"
        fill={blue}
      />
      <ellipse cx={500} cy={350} rx={110} ry={88} fill={blue} />
      <ellipse cx={505} cy={690} rx={90} ry={72} fill={blue} />
      <ellipse cx={505} cy={522} rx={275} ry={208} fill={body} />
      <g clipPath={`url(#${clip})`} stroke="#e87e2d" strokeWidth={30} fill="none">
        <path d="M362 300 Q330 520 362 745" />
        <path d="M472 300 Q445 520 472 745" />
      </g>
      <ellipse cx={586} cy={578} rx={56} ry={38} fill={blue} transform="rotate(25 586 578)" />
      <Eye x={681} y={474} w={16} />
      <ellipse cx={688} cy={540} rx={27} ry={22} fill="#ee8e7c" />
      <path
        d="M732 568 Q760 595 784 562"
        fill="none"
        stroke={INK}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <g fill="none" stroke="#7db8da">
        <circle cx={866} cy={455} r={22} strokeWidth={8} />
        <circle cx={913} cy={379} r={14} strokeWidth={8} />
        <circle cx={880} cy={327} r={9} strokeWidth={6} />
      </g>
      <Stitch d="M343 365 Q440 320 565 337" />
    </>
  );
}

function Frog() {
  const body = '#99c84d';
  const dark = '#80b03d';
  const spot = '#52b3c8';
  const ring = '#d8f0f4';
  return (
    <>
      <ellipse cx={210} cy={670} rx={80} ry={110} fill={dark} />
      <ellipse cx={814} cy={670} rx={80} ry={110} fill={dark} />
      <ellipse cx={205} cy={780} rx={113} ry={40} fill={dark} />
      <ellipse cx={819} cy={780} rx={113} ry={40} fill={dark} />
      <ellipse cx={512} cy={600} rx={305} ry={215} fill={body} />
      <circle cx={360} cy={265} r={85} fill={body} />
      <circle cx={662} cy={265} r={85} fill={body} />
      <ellipse cx={512} cy={410} rx={280} ry={185} fill={body} />
      <ellipse cx={512} cy={700} rx={187} ry={108} fill="#f1e15b" />
      <ellipse cx={402} cy={815} rx={77} ry={33} fill={dark} />
      <ellipse cx={622} cy={815} rx={77} ry={33} fill={dark} />
      <Eye x={362} y={278} w={26} />
      <Eye x={661} y={278} w={26} />
      <Spiral cx={512} cy={332} rx={47} ry={33} fill={spot} ring={ring} />
      <Spiral cx={259} cy={583} rx={44} ry={37} fill={spot} ring={ring} />
      <Spiral cx={765} cy={583} rx={44} ry={37} fill={spot} ring={ring} />
      <circle cx={482} cy={392} r={7} fill={INK} />
      <circle cx={541} cy={392} r={7} fill={INK} />
      <path
        d="M343 460 Q512 570 682 460"
        fill="none"
        stroke={INK}
        strokeWidth={10}
        strokeLinecap="round"
      />
      <ellipse cx={289} cy={441} rx={38} ry={33} fill="#d99a7a" />
      <ellipse cx={735} cy={441} rx={38} ry={33} fill="#d99a7a" />
      <Stitch d="M298 215 Q315 190 355 180" />
      <Stitch d="M637 188 L668 202" />
    </>
  );
}

function Giraffe() {
  const body = '#f2c94c';
  const shade = '#ddb03b';
  const hoof = '#d0661d';
  const spot = '#e87e2d';
  const ring = '#f5a96b';
  return (
    <>
      <path
        d="M240 578 Q185 610 195 690"
        fill="none"
        stroke={body}
        strokeWidth={18}
        strokeLinecap="round"
      />
      <ellipse cx={195} cy={712} rx={19} ry={31} fill={hoof} />
      {[292, 379].map((x) => (
        <rect key={x} x={x} y={690} width={69} height={242} rx={20} fill={shade} />
      ))}
      {[572, 659].map((x) => (
        <rect key={x} x={x} y={660} width={69} height={272} rx={30} fill={body} />
      ))}
      {[292, 379, 572, 659].map((x) => (
        <rect key={x} x={x} y={892} width={69} height={40} rx={20} fill={hoof} />
      ))}
      <ellipse cx={465} cy={620} rx={237} ry={145} fill={body} />
      <path d="M575 230 L740 230 L712 580 Q700 600 680 600 L540 590 Z" fill={body} />
      <g stroke={hoof} strokeWidth={14} strokeLinecap="round">
        <line x1={651} y1={110} x2={658} y2={160} />
        <line x1={730} y1={110} x2={722} y2={160} />
      </g>
      <circle cx={651} cy={108} r={17} fill={hoof} />
      <circle cx={730} cy={110} r={17} fill={hoof} />
      <ellipse cx={585} cy={215} rx={24} ry={15} fill={spot} transform="rotate(-30 585 215)" />
      <ellipse cx={680} cy={215} rx={105} ry={72} fill={body} />
      <ellipse cx={772} cy={255} rx={76} ry={58} fill={CREAM} />
      <Eye x={692} y={204} w={16} />
      <circle cx={818} cy={243} r={6} fill={INK} />
      <path
        d="M760 288 Q790 302 820 280"
        fill="none"
        stroke={INK}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <ellipse cx={676} cy={258} rx={24} ry={20} fill="#ee8e7c" />
      {[
        [570, 302],
        [565, 370],
        [559, 437],
        [554, 505],
      ].map(([x, y]) => (
        <ellipse key={y} cx={x} cy={y} rx={13} ry={23} fill={spot} />
      ))}
      <Spiral cx={641} cy={360} rx={27} ry={36} fill={spot} ring={ring} />
      <Spiral cx={632} cy={466} rx={27} ry={34} fill={spot} ring={ring} />
      <Spiral cx={576} cy={567} rx={38} ry={32} fill={spot} ring={ring} />
      <Spiral cx={359} cy={596} rx={55} ry={44} fill={spot} ring={ring} />
      <Spiral cx={494} cy={669} rx={48} ry={38} fill={spot} ring={ring} />
      <Stitch d="M320 545 Q370 500 435 494" />
    </>
  );
}

function Rabbit() {
  const body = '#ef8a70';
  const dark = '#e47a5e';
  const inner = '#f9c0b0';
  return (
    <>
      <ellipse cx={483} cy={215} rx={48} ry={118} fill={body} transform="rotate(-8 483 215)" />
      <ellipse cx={485} cy={228} rx={25} ry={90} fill={inner} transform="rotate(-8 485 228)" />
      <ellipse cx={620} cy={205} rx={48} ry={118} fill={body} transform="rotate(10 620 205)" />
      <ellipse cx={618} cy={218} rx={25} ry={90} fill={inner} transform="rotate(10 618 218)" />
      <circle cx={340} cy={818} r={48} fill={CREAM} />
      <path
        d="M340 760 C 330 600, 380 500, 450 470 L 640 470 C 700 600, 725 750, 720 850 C 718 885, 680 895, 640 895 L 400 895 C 360 895, 345 830, 340 760 Z"
        fill={body}
      />
      <ellipse cx={547} cy={410} rx={160} ry={115} fill={body} />
      <ellipse cx={602} cy={750} rx={75} ry={125} fill={CREAM} />
      <ellipse cx={620} cy={635} rx={38} ry={58} fill={dark} transform="rotate(-15 620 635)" />
      <ellipse cx={474} cy={897} rx={92} ry={35} fill={dark} />
      <ellipse cx={640} cy={897} rx={92} ry={35} fill={dark} />
      <Eye x={488} y={414} w={16} />
      <Eye x={620} y={414} w={16} />
      <ellipse cx={446} cy={459} rx={27} ry={23} fill="#e8746a" />
      <ellipse cx={667} cy={459} rx={27} ry={23} fill="#e8746a" />
      <rect x={545} y={474} width={20} height={26} rx={5} fill="#fff" />
      <path
        d="M530 480 Q553 480 555 458 Q557 480 580 480"
        fill="none"
        stroke={INK}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <ellipse cx={555} cy={449} rx={16} ry={11} fill="#c8545a" />
      <Stitch d="M395 388 Q390 420 400 460" />
      <Stitch d="M352 635 Q340 710 355 780" />
    </>
  );
}

function Turtle() {
  const skin = '#f1e15b';
  return (
    <>
      <path d="M95 635 L210 595 L208 655 Q205 663 195 662 L100 647 Q88 640 95 635 Z" fill={skin} />
      {[294, 584].map((x) => (
        <rect key={x} x={x} y={580} width={99} height={157} rx={49} fill={skin} />
      ))}
      <ellipse cx={825} cy={517} rx={107} ry={92} fill={skin} />
      <path d="M175 560 Q180 287 470 287 Q760 287 763 560 Z" fill="#1c7f9a" />
      <rect x={158} y={548} width={620} height={72} rx={36} fill="#156b82" />
      <line
        x1={222}
        y1={583}
        x2={715}
        y2={583}
        stroke="#fff"
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray="14 18"
      />
      <Spiral cx={473} cy={401} rx={68} ry={52} fill="#4fb3c8" ring="#d8f0f4" />
      <Spiral cx={323} cy={476} rx={57} ry={46} fill="#4fb3c8" ring="#d8f0f4" />
      <Spiral cx={623} cy={476} rx={57} ry={46} fill="#4fb3c8" ring="#d8f0f4" />
      <Eye x={859} y={492} w={16} />
      <ellipse cx={811} cy={541} rx={25} ry={22} fill="#eca86a" />
      <path
        d="M822 556 Q860 585 900 548"
        fill="none"
        stroke={INK}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <Stitch d="M230 437 Q260 360 345 320" />
    </>
  );
}

function Whale({ uid }: { uid: string }) {
  const body = '#2d80bb';
  const clip = `whale-body-${uid}`;
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <ellipse cx={585} cy={590} rx={345} ry={235} />
        </clipPath>
      </defs>
      <ellipse cx={160} cy={385} rx={60} ry={98} fill={body} transform="rotate(-35 160 385)" />
      <ellipse cx={262} cy={385} rx={60} ry={98} fill={body} transform="rotate(35 262 385)" />
      <path d="M200 430 Q120 610 280 735 L340 690 Q230 600 262 450 Z" fill={body} />
      <ellipse cx={585} cy={590} rx={345} ry={235} fill={body} />
      <g clipPath={`url(#${clip})`}>
        <ellipse cx={610} cy={830} rx={330} ry={125} fill="#f1e15b" />
        <g stroke="#e3c93e" strokeWidth={7} strokeLinecap="round">
          {[520, 608, 697, 786].map((x) => (
            <line key={x} x1={x} y1={750} x2={x - 5} y2={782} />
          ))}
        </g>
      </g>
      <ellipse cx={550} cy={675} rx={88} ry={45} fill="#216ba3" transform="rotate(25 550 675)" />
      <Eye x={778} y={540} w={16} />
      <ellipse cx={754} cy={600} rx={32} ry={27} fill="#8b80c4" />
      <path
        d="M812 641 Q870 690 917 635"
        fill="none"
        stroke={INK}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <g fill="none" stroke="#7db8da" strokeWidth={14} strokeLinecap="round">
        <path d="M553 273 Q620 230 650 345" />
        <path d="M757 275 Q680 230 650 345" />
      </g>
      <ellipse cx={651} cy={224} rx={17} ry={24} fill="#7db8da" />
      <Stitch d="M352 487 Q430 410 540 408" />
    </>
  );
}

const ART: Record<MascotId, (props: { uid: string }) => ReactElement> = {
  bear: Bear,
  cat: Cat,
  dog: Dog,
  elephant: Elephant,
  fish: Fish,
  frog: Frog,
  giraffe: Giraffe,
  rabbit: Rabbit,
  turtle: Turtle,
  whale: Whale,
};

export function MascotSvg({ id, title }: { id: MascotId; title?: string }) {
  const uid = useId().replace(/:/g, '');
  const Art = ART[id];
  return (
    <svg
      viewBox="0 0 1024 1024"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      width="100%"
      height="100%"
    >
      <Art uid={uid} />
    </svg>
  );
}
