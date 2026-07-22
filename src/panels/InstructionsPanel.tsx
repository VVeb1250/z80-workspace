import { useMemo, useState } from "react";
import { Icon } from "../Icon";
import {
  encodingComment,
  opcodeToBinary,
  opcodeToBitLayout,
} from "../instructions/z80Encodings";
import {
  displayFlagEffect,
  flagEffectDescription,
  flagEffectsFor,
  Z80_FLAG_NAMES,
} from "../instructions/z80Flags";
import {
  filterZ80Instructions,
  INSTRUCTION_GROUPS,
  instructionForms,
  instructionGroupLabel,
  Z80_INSTRUCTIONS,
  type InstructionGroupId,
} from "../instructions/z80Instructions";

function OpcodeBitDiagram({ opcode }: { opcode: string }) {
  const atoms = opcodeToBitLayout(opcode);

  return (
    <div
      aria-label={opcodeToBinary(opcode)}
      className="opcode-bit-layout"
      role="img"
    >
      <div aria-hidden="true" className="opcode-bit-layout-inner">
        {atoms.map((atom, atomIndex) =>
          atom.kind === "separator" ? (
            <span className="opcode-bit-separator" key={`separator-${atomIndex}`}>
              {atom.label}
            </span>
          ) : (
            <div className="opcode-byte-alternatives" key={`byte-${atomIndex}`}>
              {atom.alternatives.map((segments, alternativeIndex) => (
                <div className="opcode-byte-option" key={alternativeIndex}>
                  {alternativeIndex > 0 && <span>/</span>}
                  <span className="opcode-bit-byte">
                    {segments.map((segment, segmentIndex) => (
                      <span
                        className={segment.variable ? "variable" : "fixed"}
                        key={`${segment.label}-${segmentIndex}`}
                        style={{ gridColumn: `span ${segment.width}` }}
                      >
                        {segment.label}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export default function InstructionsPanel() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<InstructionGroupId | "all">("all");
  const [selectedMnemonic, setSelectedMnemonic] = useState("LD");
  const [opcodeFormat, setOpcodeFormat] = useState<"hex" | "binary">("hex");
  const matches = useMemo(
    () => filterZ80Instructions(query, group),
    [query, group],
  );
  const selected =
    matches.find((instruction) => instruction.mnemonic === selectedMnemonic) ??
    matches[0];
  const flagEffects = selected ? flagEffectsFor(selected.mnemonic) : null;

  return (
    <section aria-label="Z80 instruction reference" className="instruction-reference">
      <header className="instruction-reference-header">
        <div>
          <span className="instruction-reference-eyebrow">Toolchain reference</span>
          <h1>Z80 Instructions</h1>
          <p>Find an instruction, see what it does, then copy a valid form.</p>
        </div>
        <div className="instruction-search">
          <Icon name="search" size={15} />
          <input
            aria-label="Search instructions"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search mnemonic or purpose"
            spellCheck={false}
            type="search"
            value={query}
          />
          {query && (
            <button
              aria-label="Clear instruction search"
              className="instruction-search-clear"
              onClick={() => setQuery("")}
              type="button"
            >
              <Icon name="x" size={13} />
            </button>
          )}
        </div>
      </header>

      <nav aria-label="Instruction categories" className="instruction-categories">
        <button
          aria-pressed={group === "all"}
          onClick={() => setGroup("all")}
          type="button"
        >
          All
        </button>
        {INSTRUCTION_GROUPS.map((item) => (
          <button
            aria-pressed={group === item.id}
            key={item.id}
            onClick={() => setGroup(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="instruction-reference-body">
        <aside aria-label="Instructions" className="instruction-index">
          <div className="instruction-result-count" role="status">
            {matches.length} of {Z80_INSTRUCTIONS.length} instructions
          </div>
          <div className="instruction-index-list">
            {matches.map((instruction) => (
              <button
                aria-current={
                  instruction.mnemonic === selected?.mnemonic ? "true" : undefined
                }
                className={
                  instruction.mnemonic === selected?.mnemonic ? "active" : ""
                }
                key={instruction.mnemonic}
                onClick={() => setSelectedMnemonic(instruction.mnemonic)}
                type="button"
              >
                <strong>{instruction.mnemonic}</strong>
                <span>{instruction.summary}</span>
              </button>
            ))}
          </div>
        </aside>

        {selected ? (
          <article className="instruction-detail">
            <header className="instruction-detail-header">
              <span className="instruction-group-badge">
                {instructionGroupLabel(selected.group)}
              </span>
              <h2>{selected.mnemonic}</h2>
              <p>{selected.summary}</p>
            </header>

            <section aria-labelledby="instruction-syntax-title">
              <h3 id="instruction-syntax-title">Valid forms</h3>
              <div className="instruction-syntax-list">
                {instructionForms(selected).map((syntax) => (
                  <code key={syntax}>{syntax}</code>
                ))}
              </div>
            </section>

            <section aria-labelledby="instruction-explanation-title">
              <h3 id="instruction-explanation-title">What it does</h3>
              <p>{selected.description}</p>
            </section>

            <section aria-labelledby="instruction-example-title">
              <h3 id="instruction-example-title">Example</h3>
              <pre className="instruction-example"><code>{selected.example}</code></pre>
            </section>

            {selected.note && (
              <aside className="instruction-note">
                <strong>Good to know</strong>
                <span>{selected.note}</span>
              </aside>
            )}

            <details className="instruction-technical">
              <summary>Technical details</summary>
              <div className="instruction-technical-content">
                <div className="instruction-flag-details">
                  <h3>Flags affected</h3>
                  <div className="instruction-flag-effects">
                    {flagEffects && Z80_FLAG_NAMES.map((flag) => {
                      const effect = flagEffects[flag];
                      const description = flagEffectDescription(effect);
                      return (
                        <div
                          className="instruction-flag-effect"
                          key={flag}
                          title={`${flag}: ${description}`}
                        >
                          <span className="instruction-flag-name">{flag}</span>
                          <code>{displayFlagEffect(effect)}</code>
                          <span>{description}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="instruction-flag-legend">
                    <code>•</code> unchanged · <code>0</code> reset · <code>1</code> set · <code>↕</code> from result · <code>P</code> parity · <code>V</code> overflow · <code>IFF2</code> copied from interrupt flip-flop 2
                  </p>
                </div>
                <div className="instruction-encoding-details">
                  <div className="instruction-encoding-heading">
                    <h3>Opcode and timing</h3>
                    <div
                      aria-label="Opcode display format"
                      className="instruction-opcode-format"
                      role="group"
                    >
                      <button
                        aria-pressed={opcodeFormat === "hex"}
                        onClick={() => setOpcodeFormat("hex")}
                        type="button"
                      >
                        HEX
                      </button>
                      <button
                        aria-pressed={opcodeFormat === "binary"}
                        onClick={() => setOpcodeFormat("binary")}
                        type="button"
                      >
                        Binary
                      </button>
                    </div>
                  </div>
                  <div className="instruction-encoding-table-wrap">
                    <table
                      className="instruction-encoding-table"
                      data-opcode-format={opcodeFormat}
                    >
                      <thead>
                        <tr>
                          <th scope="col">Form</th>
                          <th scope="col">
                            Opcode ({opcodeFormat === "hex" ? "hex" : "binary"})
                          </th>
                          <th scope="col">Bytes</th>
                          <th scope="col">M-cycles</th>
                          <th scope="col">T-states</th>
                          <th scope="col">Comments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.encodings.map((encoding) => (
                          <tr key={`${encoding.form}-${encoding.opcode}`}>
                            <th scope="row"><code>{encoding.form}</code></th>
                            <td>
                              {opcodeFormat === "hex" ? (
                                <code>{encoding.opcode}</code>
                              ) : (
                                <OpcodeBitDiagram opcode={encoding.opcode} />
                              )}
                            </td>
                            <td>{encoding.bytes}</td>
                            <td>{encoding.mCycles}</td>
                            <td>{encoding.tStates}</td>
                            <td className="instruction-encoding-comment">
                              {encodingComment(selected.mnemonic, encoding)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="instruction-encoding-legend">
                    Slash-separated timing means stop/not taken first, then
                    repeat/taken. <code>r</code> = register, <code>rp</code> =
                    register pair, <code>cc</code> = condition, <code>b</code> =
                    bit, <code>d/e</code> = displacement, and <code>n/nn</code> =
                    immediate byte/word.
                  </p>
                </div>
              </div>
            </details>

            <footer className="instruction-source">
              Based on the official{" "}
              <a
                href="https://www.zilog.com/docs/z80/um0080.pdf"
                rel="noreferrer"
                target="_blank"
              >
                Zilog Z80 CPU User Manual
              </a>
              .
            </footer>
          </article>
        ) : (
          <div className="instruction-empty" role="status">
            <Icon name="search" size={20} />
            <strong>No matching instructions</strong>
            <span>Try a mnemonic such as LD, JP or XOR.</span>
          </div>
        )}
      </div>
    </section>
  );
}
