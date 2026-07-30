// Annotated drawing of the Z80sim screen. Numbers match SIM_SCREEN_REGIONS,
// which the guide renders as the legend beside it.
const MEMORY_ROWS = ["1000", "1010", "1020", "1030", "1040"];

const badge = (n: number, x: number, y: number) => (
  <g key={`badge-${n}`}>
    <circle className="sim-map-badge" cx={x} cy={y} r={9} />
    <text className="sim-map-badge-text" x={x} y={y + 4} textAnchor="middle">
      {n}
    </text>
  </g>
);

export default function SimScreenMap({ label }: { label: string }) {
  return (
    <svg
      aria-label={label}
      className="sim-map"
      role="img"
      viewBox="0 0 560 430"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect className="sim-map-screen" x="34" y="8" width="516" height="300" />

      {/* registers */}
      <rect className="sim-map-box" x="44" y="16" width="496" height="44" />
      <text className="sim-map-mono" x="54" y="33">
        A = 00  B = 00  C = 00  D = 00  E = 00  H = 00  L = 00  F = 00000000
      </text>
      <text className="sim-map-mono" x="54" y="51">
        A'= 00  B'= 00  C'= 00  D'= 00  E'= 00  H'= 00  L'= 00  F'= 00000000
      </text>
      {badge(1, 20, 38)}

      {/* counters */}
      <text className="sim-map-mono" x="54" y="76">
        IX = 0000    IY = 0000       SP = 0999      PC = 1000
      </text>
      <text className="sim-map-mono" x="54" y="94">
        Machine Cycles =        0    Execution Time = 0.00000000 s
      </text>
      {badge(2, 20, 85)}

      {/* memory dump */}
      <rect className="sim-map-box" x="44" y="104" width="496" height="104" />
      {MEMORY_ROWS.map((address, row) => (
        <text
          className="sim-map-mono"
          key={address}
          x="54"
          y={122 + row * 19}
        >
          {address} : 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
        </text>
      ))}
      {badge(3, 20, 156)}

      {/* command line */}
      <rect className="sim-map-box" x="44" y="216" width="496" height="26" />
      <text className="sim-map-mono" x="54" y="234">
        =========&gt;&gt;
      </text>
      {badge(4, 20, 229)}

      {/* message line */}
      <rect className="sim-map-box" x="44" y="246" width="496" height="26" />
      <text className="sim-map-mono" x="54" y="264">
        Message:&gt;&gt;
      </text>
      {badge(5, 20, 259)}

      {/* status bar */}
      <rect className="sim-map-box" x="44" y="276" width="496" height="26" />
      <text className="sim-map-mono" x="54" y="294">
        <tspan className="sim-map-key">H</tspan>elp{"  "}
        <tspan className="sim-map-key">G</tspan>o{"  "}
        <tspan className="sim-map-key">L</tspan>oad{"  "}
        <tspan className="sim-map-key">T</tspan>race{"  "}
        <tspan className="sim-map-key">E</tspan>ditor{"  "}
        <tspan className="sim-map-key">Alt-X</tspan> eXit
      </text>
      {badge(6, 20, 289)}

      {/* ET-Board hardware */}
      <rect className="sim-map-board" x="34" y="320" width="516" height="96" />
      <rect className="sim-map-lcd" x="54" y="338" width="176" height="42" />
      <text className="sim-map-caption" x="128" y="400">
        LCD
      </text>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <circle
          className="sim-map-led"
          cx={260 + i * 17}
          cy={359}
          key={`led-${i}`}
          r={6}
        />
      ))}
      <text className="sim-map-caption" x="310" y="400">
        LEDs
      </text>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect
          className="sim-map-dip"
          height="22"
          key={`dip-${i}`}
          width="6"
          x={396 + i * 11}
          y={348}
        />
      ))}
      <text className="sim-map-caption" x="415" y="400">
        DIP F3–F10
      </text>
      {badge(7, 20, 368)}
    </svg>
  );
}
