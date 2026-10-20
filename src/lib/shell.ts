import type { FamilyId } from "@/data/types";

/**
 * Terminal simulada de TuxQuest.
 * Todo ocurre en memoria: un sistema de archivos virtual y un intérprete que imita bash.
 * Nunca se ejecuta nada en la computadora del jugador.
 */

interface FileNode {
  kind: "file";
  content: string;
  mode: string;
  owner: string;
}
interface DirNode {
  kind: "dir";
  children: Record<string, Node>;
  mode: string;
  owner: string;
}
type Node = FileNode | DirNode;

export interface OutLine {
  text: string;
  kind: "out" | "err";
}

interface Ctx {
  sudo: boolean;
  stdin: string | null;
}
interface Res {
  out?: string;
  err?: string;
  code?: number;
}

const file = (content: string, mode = "-rw-r--r--", owner = "tux"): FileNode => ({ kind: "file", content, mode, owner });
const dir = (children: Record<string, Node> = {}, mode = "drwxr-xr-x", owner = "tux"): DirNode => ({ kind: "dir", children, mode, owner });

const SYSLOG = [
  "oct 20 09:58:01 HOST systemd[1]: Started Daily apt download activities.",
  "oct 20 09:58:12 HOST kernel: usb 1-2: new high-speed USB device number 4",
  "oct 20 09:59:03 HOST NetworkManager[812]: <info> device (wlan0): state change: activated",
  "oct 20 10:00:44 HOST nginx[1033]: error: could not open /etc/nginx/sites-enabled/test",
  "oct 20 10:01:15 HOST systemd[1]: Starting Cleanup of Temporary Directories...",
  "oct 20 10:02:37 HOST sshd[1290]: Accepted password for tux from 192.168.1.20 port 51422",
  "oct 20 10:03:02 HOST kernel: error: thermal zone0 critical temperature reached",
  "oct 20 10:04:19 HOST cron[701]: (tux) CMD (/home/tux/proyectos/script.sh)",
  "oct 20 10:05:55 HOST systemd[1]: Finished Cleanup of Temporary Directories.",
  "oct 20 10:06:30 HOST bluetoothd[640]: Bluetooth management interface 1.22 initialized",
  "oct 20 10:07:41 HOST pulseaudio[1502]: error: failed to load module module-x11-bell",
  "oct 20 10:08:12 HOST systemd[1]: Started Session 4 of user tux.",
];

function buildFs(hostname: string, prettyName: string, idLike: string): DirNode {
  return dir(
    {
      home: dir({
        tux: dir({
          Documentos: dir({
            "notas.txt": file("Mis notas de Linux\nLinux es libre y gratuito.\nla terminal de linux es poderosa\nTux es la mascota de LINUX\n"),
            "informe.txt": file("Informe mensual\nTodo funciona correctamente.\n"),
            "tareas.txt": file("estudiar permisos\ninstalar firefox\nestudiar permisos\npracticar grep\n"),
          }),
          Descargas: dir({
            "foto.jpg": file("\u0000JPEG"),
            "musica.mp3": file("\u0000MP3"),
            "proyecto.tar.gz": file("\u0000GZIP"),
          }),
          Imagenes: dir(),
          Musica: dir({ "cancion.mp3": file("\u0000MP3") }),
          respaldo: dir(),
          proyectos: dir({
            "app.py": file('# TODO: validar datos\nprint("Hola desde TuxQuest")\n', "-rwxrwxrwx"),
            "script.sh": file('#!/bin/bash\n# TODO: agregar respaldo\necho "Respaldo listo"\n'),
            web: dir({
              "index.html": file("<!doctype html>\n<h1>Mi web</h1>\n<!-- TODO: menú -->\n"),
              "estilos.css": file("body { color: #333; }\n"),
            }),
          }),
          ".bashrc": file("# ~/.bashrc\nalias ll='ls -l'\nexport EDITOR=nano\n"),
          ".config": dir(),
        }),
        ana: dir({}, "drwx------", "ana"),
      }),
      etc: dir(
        {
          hostname: file(hostname + "\n", "-rw-r--r--", "root"),
          "os-release": file(`NAME="${prettyName}"\nPRETTY_NAME="${prettyName}"\nID=${hostname}\nID_LIKE=${idLike}\nHOME_URL="https://tuxquest.local"\n`, "-rw-r--r--", "root"),
          passwd: file("root:x:0:0:root:/root:/bin/bash\ntux:x:1000:1000:Tux:/home/tux:/bin/bash\nana:x:1001:1001:Ana:/home/ana:/bin/bash\n", "-rw-r--r--", "root"),
        },
        "drwxr-xr-x",
        "root",
      ),
      var: dir({ log: dir({ syslog: file(SYSLOG.map((l) => l.replace("HOST", hostname)).join("\n") + "\n", "-rw-r--r--", "root"), "pacman.log": file("[2026-10-19] upgraded firefox\n", "-rw-r--r--", "root") }, "drwxr-xr-x", "root") }, "drwxr-xr-x", "root"),
      tmp: dir({}, "drwxrwxrwt", "root"),
      usr: dir({ bin: dir({ ls: file("ELF", "-rwxr-xr-x", "root"), bash: file("ELF", "-rwxr-xr-x", "root") }, "drwxr-xr-x", "root") }, "drwxr-xr-x", "root"),
      root: dir({}, "drwx------", "root"),
    },
    "drwxr-xr-x",
    "root",
  );
}

const PROCESSES = [
  { pid: 1, user: "root", cmd: "/sbin/init" },
  { pid: 640, user: "root", cmd: "/usr/lib/bluetooth/bluetoothd" },
  { pid: 812, user: "root", cmd: "/usr/sbin/NetworkManager" },
  { pid: 1033, user: "root", cmd: "nginx: master process" },
  { pid: 1234, user: "tux", cmd: "/usr/bin/gedit" },
  { pid: 1502, user: "tux", cmd: "/usr/bin/pulseaudio" },
  { pid: 2210, user: "tux", cmd: "/usr/lib/firefox/firefox" },
  { pid: 2245, user: "tux", cmd: "/usr/lib/firefox/firefox -contentproc" },
  { pid: 4321, user: "tux", cmd: "python3 app.py" },
];

/** Comandos que solo existen en ciertas familias o distribuciones. */
const FAMILY_COMMANDS: Record<string, FamilyId[]> = {
  apt: ["debian"], "apt-get": ["debian"], "apt-cache": ["debian"], dpkg: ["debian"],
  pacman: ["arch"], paccache: ["arch"],
  dnf: ["redhat"], yum: ["redhat"], "firewall-cmd": ["redhat"], getenforce: ["redhat"], sestatus: ["redhat"],
  zypper: ["suse"], yast: ["suse"],
  rpm: ["redhat", "suse"],
};
const DISTRO_COMMANDS: Record<string, string[]> = {
  snap: ["ubuntu"],
  "do-release-upgrade": ["ubuntu"],
  flatpak: ["fedora", "mint"],
  yay: ["endeavouros"],
  paru: ["cachyos"],
  pamac: ["manjaro"],
  "pacman-mirrors": ["manjaro"],
};

const ROOT_ERRORS: Record<string, string> = {
  apt: "E: No se pudo abrir el fichero de bloqueo /var/lib/dpkg/lock-frontend - open (13: Permiso denegado)\nE: No se pudo obtener el bloqueo. ¿Es usted root?",
  pacman: "error: no puede realizar esta operación a menos que sea root.",
  dnf: "Error: Este comando debe ejecutarse con privilegios de superusuario (en la mayoría de los sistemas, el usuario root).",
  zypper: "Se requieren privilegios de root para instalar o desinstalar paquetes.",
};

function glob(pattern: string, name: string) {
  const re = new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
  return re.test(name);
}

const fakeSize = (n: Node) => (n.kind === "dir" ? 4096 : n.content.startsWith("\u0000") ? 248_312 : n.content.length);
const human = (b: number) => (b >= 1024 * 1024 ? (b / 1024 / 1024).toFixed(1) + "M" : b >= 1024 ? Math.round(b / 1024) + "K" : String(b));

interface Token {
  v: string;
  quoted: boolean;
}

export class Shell {
  private root: DirNode;
  cwd: string;
  private prev: string;
  readonly user = "tux";
  readonly home = "/home/tux";
  readonly history: string[] = [];

  readonly hostname: string;
  readonly distroId: string;
  readonly familyId: FamilyId;

  constructor(hostname: string, distroId: string, familyId: FamilyId, prettyName: string, cwd = "~") {
    this.hostname = hostname;
    this.distroId = distroId;
    this.familyId = familyId;
    const idLike = { debian: "debian", arch: "arch", redhat: "rhel fedora", suse: "suse opensuse" }[familyId];
    this.root = buildFs(hostname, prettyName, idLike);
    this.cwd = this.resolve(cwd);
    this.prev = this.cwd;
  }

  get prompt() {
    const p = this.cwd === this.home ? "~" : this.cwd.startsWith(this.home + "/") ? "~" + this.cwd.slice(this.home.length) : this.cwd;
    return `${this.user}@${this.hostname}:${p}$`;
  }

  // ---------- Sistema de archivos ----------
  private resolve(path: string): string {
    let p = path;
    if (p === "~" || p.startsWith("~/")) p = this.home + p.slice(1);
    if (!p.startsWith("/")) p = this.cwd + "/" + p;
    const parts: string[] = [];
    for (const seg of p.split("/")) {
      if (!seg || seg === ".") continue;
      if (seg === "..") parts.pop();
      else parts.push(seg);
    }
    return "/" + parts.join("/");
  }
  private get(abs: string): Node | null {
    let n: Node = this.root;
    for (const seg of abs.split("/").filter(Boolean)) {
      if (n.kind !== "dir" || !(seg in n.children)) return null;
      n = n.children[seg];
    }
    return n;
  }
  private parentOf(abs: string): [DirNode | null, string] {
    const i = abs.lastIndexOf("/");
    const parent = this.get(abs.slice(0, i) || "/");
    return [parent && parent.kind === "dir" ? parent : null, abs.slice(i + 1)];
  }
  private walk(abs: string, n: Node, fn: (path: string, node: Node, name: string) => void, name = abs.split("/").pop() || "/") {
    fn(abs, n, name);
    if (n.kind === "dir") for (const [k, c] of Object.entries(n.children)) this.walk(abs === "/" ? "/" + k : abs + "/" + k, c, fn, k);
  }
  private display(abs: string, original: string) {
    if (original.startsWith("/")) return abs;
    if (original.startsWith("~")) return "~" + abs.slice(this.home.length);
    return original.replace(/\/$/, "");
  }

  /** Autocompletado con Tab: devuelve la palabra completada (o la misma si no hay una única opción). */
  complete(word: string): string {
    const slash = word.lastIndexOf("/");
    const dirPart = slash >= 0 ? word.slice(0, slash + 1) : "";
    const prefix = word.slice(slash + 1);
    const d = this.get(this.resolve(dirPart || "."));
    if (!d || d.kind !== "dir") return word;
    const matches = Object.keys(d.children).filter((k) => k.startsWith(prefix) && (prefix.startsWith(".") || !k.startsWith(".")));
    if (matches.length !== 1) return word;
    const node = d.children[matches[0]];
    return dirPart + matches[0] + (node.kind === "dir" ? "/" : " ");
  }

  // ---------- Intérprete ----------
  private scan(line: string): (Token | { op: string })[] {
    const out: (Token | { op: string })[] = [];
    let cur = "";
    let has = false;
    let quoted = false;
    let quote: string | null = null;
    let depth = 0;
    const push = () => {
      if (has) out.push({ v: cur, quoted });
      cur = "";
      has = false;
      quoted = false;
    };
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const two = line.slice(i, i + 2);
      if (quote) {
        if (ch === quote) quote = null;
        else cur += ch;
        continue;
      }
      if (ch === "$" && line[i + 1] === "(") depth++;
      if (ch === ")" && depth > 0) depth--;
      if (depth > 0 || (ch === ")" && cur.includes("$("))) {
        cur += ch;
        has = true;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        has = true;
        quoted = true;
      } else if (two === "&&" || two === "||" || two === ">>") {
        push();
        out.push({ op: two });
        i++;
      } else if (ch === "|" || ch === ";" || ch === ">") {
        push();
        out.push({ op: ch });
      } else if (/\s/.test(ch)) push();
      else {
        cur += ch;
        has = true;
      }
    }
    push();
    return out;
  }

  run(line: string): { lines: OutLine[]; clear: boolean } {
    const lines: OutLine[] = [];
    let clear = false;
    if (line.trim()) this.history.push(line);
    const items = this.scan(line);
    // Separar en secuencias por ; && ||
    let seq: (Token | { op: string })[] = [];
    let lastCode = 0;
    let skip = false;
    const flush = () => {
      if (seq.length && !skip) {
        const r = this.pipeline(seq);
        if (r.clear) clear = true;
        lines.push(...r.lines);
        lastCode = r.code;
      }
      seq = [];
    };
    for (const it of items) {
      if ("op" in it && (it.op === ";" || it.op === "&&" || it.op === "||")) {
        flush();
        skip = it.op === "&&" ? lastCode !== 0 : it.op === "||" ? lastCode === 0 : false;
      } else seq.push(it);
    }
    flush();
    return { lines, clear };
  }

  private pipeline(items: (Token | { op: string })[]): { lines: OutLine[]; code: number; clear: boolean } {
    const lines: OutLine[] = [];
    const stages: Token[][] = [[]];
    let redirect: { file: string; append: boolean } | null = null;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if ("op" in it) {
        if (it.op === "|") stages.push([]);
        else if (it.op === ">" || it.op === ">>") {
          const target = items[i + 1];
          if (!target || "op" in target) return { lines: [{ text: "bash: error sintáctico cerca del elemento inesperado `newline'", kind: "err" }], code: 2, clear: false };
          redirect = { file: target.v, append: it.op === ">>" };
          i++;
        }
      } else stages[stages.length - 1].push(it);
    }
    let stdin: string | null = null;
    let code = 0;
    let clear = false;
    for (const stage of stages) {
      if (!stage.length) continue;
      let words = this.expand(stage);
      let sudo = false;
      if (words[0] === "sudo") {
        sudo = true;
        words = words.slice(1).filter((w, i) => !(i === 0 && w === "-E"));
        if (!words.length) {
          lines.push({ text: "uso: sudo comando", kind: "err" });
          return { lines, code: 1, clear };
        }
      }
      if (sudo && (words[0] === "-i" || words[0] === "-s" || words[0] === "su")) words = ["su"];
      if (words[0] === "clear") {
        clear = true;
        stdin = "";
        continue;
      }
      const r = this.exec(words[0], words.slice(1), { sudo, stdin });
      if (r.err) lines.push(...r.err.replace(/\n$/, "").split("\n").map((text) => ({ text, kind: "err" as const })));
      stdin = r.out ?? "";
      code = r.code ?? (r.err && !r.out ? 1 : 0);
    }
    if (redirect && stdin !== null) {
      const abs = this.resolve(redirect.file);
      const [parent, name] = this.parentOf(abs);
      const existing = this.get(abs);
      if (!parent) lines.push({ text: `bash: ${redirect.file}: No existe el archivo o el directorio`, kind: "err" });
      else if (existing?.kind === "dir") lines.push({ text: `bash: ${redirect.file}: Es un directorio`, kind: "err" });
      else if (!this.canWrite(parent)) lines.push({ text: `bash: ${redirect.file}: Permiso denegado`, kind: "err" });
      else parent.children[name] = file((redirect.append && existing?.kind === "file" ? existing.content : "") + stdin);
    } else if (stdin) {
      lines.push(...stdin.replace(/\n$/, "").split("\n").map((text) => ({ text, kind: "out" as const })));
    }
    return { lines, code, clear };
  }

  private canWrite(d: DirNode) {
    return d.owner === this.user || d.mode === "drwxrwxrwt";
  }

  /** Expande ~ y comodines (*) no entrecomillados. */
  private expand(tokens: Token[]): string[] {
    const out: string[] = [];
    tokens.forEach((t, i) => {
      if (t.quoted) return out.push(t.v);
      let v = t.v;
      if (v === "~" || v.startsWith("~/")) v = this.home + v.slice(1);
      const prev = tokens[i - 1]?.v;
      if (v.includes("*") && prev !== "-name" && prev !== "-iname") {
        const abs = this.resolve(v);
        const [parent, pat] = this.parentOf(abs);
        const matches = parent ? Object.keys(parent.children).filter((k) => !k.startsWith(".") && glob(pat, k)).sort() : [];
        if (matches.length) {
          const prefix = v.includes("/") ? v.slice(0, v.lastIndexOf("/") + 1) : "";
          return out.push(...matches.map((m) => prefix + m));
        }
      }
      out.push(v);
    });
    return out;
  }

  private exec(cmd: string, args: string[], ctx: Ctx): Res {
    if (FAMILY_COMMANDS[cmd] && !FAMILY_COMMANDS[cmd].includes(this.familyId)) return this.notFound(cmd);
    if (DISTRO_COMMANDS[cmd] && !DISTRO_COMMANDS[cmd].includes(this.distroId)) return this.notFound(cmd);
    const fn = (this.commands as Record<string, (a: string[], c: Ctx) => Res>)[cmd];
    if (!fn) return this.notFound(cmd);
    return fn.call(this, args, ctx);
  }

  private notFound(cmd: string): Res {
    return { err: `bash: ${cmd}: orden no encontrada`, code: 127 };
  }

  private flags(args: string[]) {
    const set = new Set<string>();
    const rest: string[] = [];
    for (const a of args) {
      if (a.startsWith("--")) set.add(a);
      else if (a.startsWith("-") && a.length > 1 && !/^-\d/.test(a)) for (const c of a.slice(1)) set.add(c);
      else rest.push(a);
    }
    return { has: (f: string) => set.has(f), rest };
  }

  private read(path: string, cmd: string, ctx: Ctx): [string | null, string | null] {
    const n = this.get(this.resolve(path));
    if (!n) return [null, `${cmd}: ${path}: No existe el archivo o el directorio`];
    if (n.kind === "dir") return [null, `${cmd}: ${path}: Es un directorio`];
    if (n.mode[7] !== "r" && n.owner !== this.user && !ctx.sudo) return [null, `${cmd}: ${path}: Permiso denegado`];
    return [n.content.startsWith("\u0000") ? "(archivo binario)\n" : n.content, null];
  }

  private inputOf(rest: string[], cmd: string, ctx: Ctx): [string, string | undefined] {
    if (!rest.length) return [ctx.stdin ?? "", undefined];
    const [c, e] = this.read(rest[0], cmd, ctx);
    return [c ?? "", e ?? undefined];
  }

  private lsLong(name: string, n: Node) {
    const links = n.kind === "dir" ? 2 : 1;
    return `${n.mode} ${links} ${n.owner.padEnd(4)} ${n.owner.padEnd(4)} ${String(fakeSize(n)).padStart(6)} oct 20 10:00 ${name}`;
  }

  // ---------- Comandos ----------
  private commands = {
    pwd: () => ({ out: this.cwd + "\n" }),
    cd: (args: string[]): Res => {
      let target = args[0] ?? "~";
      if (target === "-") target = this.prev;
      const abs = this.resolve(target);
      const n = this.get(abs);
      if (!n) return { err: `bash: cd: ${args[0]}: No existe el archivo o el directorio` };
      if (n.kind !== "dir") return { err: `bash: cd: ${args[0]}: No es un directorio` };
      if (n.owner !== this.user && n.mode === "drwx------") return { err: `bash: cd: ${args[0]}: Permiso denegado` };
      this.prev = this.cwd;
      this.cwd = abs;
      return { out: args[0] === "-" ? abs + "\n" : "" };
    },
    ls: (args: string[], ctx: Ctx): Res => {
      const f = this.flags(args);
      const all = f.has("a") || f.has("A");
      const long = f.has("l");
      const targets = f.rest.length ? f.rest : ["."];
      const out: string[] = [];
      const errs: string[] = [];
      for (const t of targets) {
        const n = this.get(this.resolve(t));
        if (!n) {
          errs.push(`ls: no se puede acceder a '${t}': No existe el archivo o el directorio`);
          continue;
        }
        if (n.kind === "file") {
          out.push(long ? this.lsLong(t, n) : t);
          continue;
        }
        if (n.owner !== this.user && n.mode === "drwx------" && !ctx.sudo) {
          errs.push(`ls: no se puede abrir el directorio '${t}': Permiso denegado`);
          continue;
        }
        if (targets.length > 1) out.push(`${t}:`);
        let names = Object.keys(n.children).sort((a, b) => a.replace(/^\./, "").localeCompare(b.replace(/^\./, "")));
        if (!all) names = names.filter((k) => !k.startsWith("."));
        if (f.has("a")) names = [".", "..", ...names];
        if (long) {
          out.push(`total ${names.length * 4}`);
          for (const k of names) out.push(this.lsLong(k, k === "." || k === ".." ? n : n.children[k]));
        } else if (names.length) out.push(names.join("  "));
      }
      return { out: out.length ? out.join("\n") + "\n" : "", err: errs.join("\n") || undefined };
    },
    mkdir: (args: string[]): Res => {
      const f = this.flags(args);
      if (!f.rest.length) return { err: "mkdir: falta un operando" };
      const errs: string[] = [];
      for (const p of f.rest) {
        const abs = this.resolve(p);
        if (f.has("p")) {
          let cur: DirNode = this.root;
          for (const seg of abs.split("/").filter(Boolean)) {
            const nx: Node = cur.children[seg] ?? (cur.children[seg] = dir());
            if (nx.kind !== "dir") {
              errs.push(`mkdir: no se puede crear el directorio «${p}»: No es un directorio`);
              break;
            }
            cur = nx;
          }
          continue;
        }
        const [parent, name] = this.parentOf(abs);
        if (!parent) errs.push(`mkdir: no se puede crear el directorio «${p}»: No existe el archivo o el directorio`);
        else if (parent.children[name]) errs.push(`mkdir: no se puede crear el directorio «${p}»: El archivo ya existe`);
        else if (!this.canWrite(parent)) errs.push(`mkdir: no se puede crear el directorio «${p}»: Permiso denegado`);
        else parent.children[name] = dir();
      }
      return { err: errs.join("\n") || undefined };
    },
    touch: (args: string[]): Res => {
      if (!args.length) return { err: "touch: falta un operando de archivo" };
      for (const p of args) {
        const [parent, name] = this.parentOf(this.resolve(p));
        if (!parent) return { err: `touch: no se puede efectuar \`touch' sobre '${p}': No existe el archivo o el directorio` };
        if (!parent.children[name]) parent.children[name] = file("");
      }
      return {};
    },
    cat: (args: string[], ctx: Ctx): Res => {
      if (!args.length) return { out: ctx.stdin ?? "" };
      let out = "";
      const errs: string[] = [];
      for (const p of args) {
        const [c, e] = this.read(p, "cat", ctx);
        if (e) errs.push(e);
        else out += c;
      }
      return { out, err: errs.join("\n") || undefined };
    },
    echo: (args: string[]) => {
      const n = args[0] === "-n";
      const text = (n ? args.slice(1) : args).join(" ").replace(/\$USER/g, this.user).replace(/\$HOME/g, this.home).replace(/\$PATH/g, "/usr/local/bin:/usr/bin:/bin");
      return { out: text + (n ? "" : "\n") };
    },
    rm: (args: string[]): Res => {
      const f = this.flags(args);
      if (!f.rest.length) return { err: "rm: falta un operando" };
      const errs: string[] = [];
      for (const p of f.rest) {
        const abs = this.resolve(p);
        const n = this.get(abs);
        const [parent, name] = this.parentOf(abs);
        if (!n || !parent) {
          if (!f.has("f")) errs.push(`rm: no se puede borrar '${p}': No existe el archivo o el directorio`);
        } else if (n.kind === "dir" && !f.has("r") && !f.has("R")) errs.push(`rm: no se puede borrar '${p}': Es un directorio`);
        else if (abs === "/" || abs === this.home) errs.push(`rm: es peligroso operar recursivamente sobre '${p}'`);
        else delete parent.children[name];
      }
      return { err: errs.join("\n") || undefined };
    },
    rmdir: (args: string[]): Res => {
      for (const p of args) {
        const abs = this.resolve(p);
        const n = this.get(abs);
        const [parent, name] = this.parentOf(abs);
        if (!n || !parent) return { err: `rmdir: fallo al borrar '${p}': No existe el archivo o el directorio` };
        if (n.kind !== "dir") return { err: `rmdir: fallo al borrar '${p}': No es un directorio` };
        if (Object.keys(n.children).length) return { err: `rmdir: fallo al borrar '${p}': El directorio no está vacío` };
        delete parent.children[name];
      }
      return {};
    },
    cp: (args: string[]) => this.copyMove(args, "cp"),
    mv: (args: string[]) => this.copyMove(args, "mv"),
    ln: (args: string[]): Res => {
      const f = this.flags(args);
      if (f.rest.length < 2) return { err: "ln: falta el operando de archivo de destino" };
      const [parent, name] = this.parentOf(this.resolve(f.rest[1]));
      if (!parent) return { err: "ln: no se pudo crear el enlace: No existe el archivo o el directorio" };
      const target = this.get(this.resolve(f.rest[0]));
      parent.children[name] = target && f.has("s") ? target : file("", "lrwxrwxrwx");
      return {};
    },
    head: (args: string[], ctx: Ctx) => this.headTail(args, ctx, "head"),
    tail: (args: string[], ctx: Ctx) => this.headTail(args, ctx, "tail"),
    wc: (args: string[], ctx: Ctx): Res => {
      const f = this.flags(args);
      const [text, err] = this.inputOf(f.rest, "wc", ctx);
      if (err) return { err };
      const l = text.split("\n").length - 1;
      const w = text.split(/\s+/).filter(Boolean).length;
      const name = f.rest[0] ? " " + f.rest[0] : "";
      if (f.has("l")) return { out: `${l}${name}\n` };
      if (f.has("w")) return { out: `${w}${name}\n` };
      return { out: `${l} ${w} ${text.length}${name}\n` };
    },
    sort: (args: string[], ctx: Ctx): Res => {
      const f = this.flags(args);
      const [text, err] = this.inputOf(f.rest, "sort", ctx);
      if (err) return { err };
      let ls = text.split("\n").filter(Boolean).sort((a, b) => a.localeCompare(b));
      if (f.has("r")) ls.reverse();
      if (f.has("u")) ls = [...new Set(ls)];
      return { out: ls.map((l) => l + "\n").join("") };
    },
    uniq: (args: string[], ctx: Ctx): Res => {
      const [text, err] = this.inputOf(args, "uniq", ctx);
      if (err) return { err };
      return { out: text.split("\n").filter(Boolean).filter((l, i, a) => l !== a[i - 1]).map((l) => l + "\n").join("") };
    },
    grep: (args: string[], ctx: Ctx): Res => {
      const f = this.flags(args);
      const [pattern, ...paths] = f.rest;
      if (!pattern) return { err: "Modo de empleo: grep [OPCIÓN]... PATRONES [ARCHIVO]..." };
      const ic = f.has("i");
      const match = (l: string) => (ic ? l.toLowerCase().includes(pattern.toLowerCase()) : l.includes(pattern));
      const results: string[] = [];
      let count = 0;
      const errs: string[] = [];
      const scanText = (text: string, label: string | null) => {
        text.split("\n").forEach((l, i) => {
          if (l && match(l) !== f.has("v")) {
            count++;
            results.push(`${label ? label + ":" : ""}${f.has("n") ? i + 1 + ":" : ""}${l}`);
          }
        });
      };
      if (!paths.length) scanText(ctx.stdin ?? "", null);
      for (const p of paths) {
        const abs = this.resolve(p);
        const n = this.get(abs);
        if (!n) errs.push(`grep: ${p}: No existe el archivo o el directorio`);
        else if (n.kind === "dir") {
          if (!f.has("r") && !f.has("R")) errs.push(`grep: ${p}: Es un directorio`);
          else this.walk(abs, n, (path, node) => node.kind === "file" && !node.content.startsWith("\u0000") && scanText(node.content, this.display(path, p + path.slice(abs.length))));
        } else {
          const [c, e] = this.read(p, "grep", ctx);
          if (e) errs.push(e);
          else scanText(c!, paths.length > 1 ? p : null);
        }
      }
      if (f.has("c")) return { out: count + "\n", err: errs.join("\n") || undefined };
      return { out: results.map((r) => r + "\n").join(""), err: errs.join("\n") || undefined, code: count ? 0 : 1 };
    },
    find: (args: string[]): Res => {
      const start = args[0] && !args[0].startsWith("-") ? args[0] : ".";
      const opts = args[0] === start ? args.slice(1) : args;
      const get = (k: string) => {
        const i = opts.indexOf(k);
        return i >= 0 ? opts[i + 1] : undefined;
      };
      const stray = opts.find((o, i) => !o.startsWith("-") && !opts[i - 1]?.startsWith("-"));
      if (stray) return { err: `find: los caminos deben preceder a la expresión: '${stray}'` };
      const abs = this.resolve(start);
      const root = this.get(abs);
      if (!root) return { err: `find: '${start}': No existe el archivo o el directorio` };
      const name = get("-name") ?? get("-iname");
      const type = get("-type");
      const size = get("-size");
      const out: string[] = [];
      this.walk(abs, root, (path, node, nm) => {
        if (name && !glob(get("-iname") ? name.toLowerCase() : name, get("-iname") ? nm.toLowerCase() : nm)) return;
        if (type === "d" && node.kind !== "dir") return;
        if (type === "f" && node.kind !== "file") return;
        if (size?.startsWith("+") && fakeSize(node) < 100 * 1024 * 1024) return;
        out.push(start === "." ? "." + path.slice(abs.length) || "." : this.display(path, start + path.slice(abs.length)));
      });
      return { out: out.map((l) => (l || ".") + "\n").join("") };
    },
    chmod: (args: string[], ctx: Ctx): Res => {
      const f = this.flags(args);
      const [mode, ...paths] = f.rest;
      if (!mode || !paths.length) return { err: "chmod: falta un operando" };
      if (!/^[0-7]{3,4}$/.test(mode) && !/^[ugoa]*[+\-=][rwxX]+$/.test(mode)) return { err: `chmod: modo inválido: «${mode}»` };
      for (const p of paths) {
        const n = this.get(this.resolve(p));
        if (!n) return { err: `chmod: no se puede acceder a '${p}': No existe el archivo o el directorio` };
        if (n.owner !== this.user && !ctx.sudo) return { err: `chmod: cambiando los permisos de '${p}': Operación no permitida` };
        n.mode = n.mode[0] + this.applyMode(n.mode.slice(1), mode);
      }
      return {};
    },
    chown: (args: string[], ctx: Ctx): Res => {
      const f = this.flags(args);
      const [owner, ...paths] = f.rest;
      if (!owner || !paths.length) return { err: "chown: falta un operando" };
      if (!ctx.sudo) return { err: `chown: cambiando el propietario de '${paths[0]}': Operación no permitida` };
      const user = owner.split(":")[0];
      for (const p of paths) {
        const abs = this.resolve(p);
        const n = this.get(abs);
        if (!n) return { err: `chown: no se puede acceder a '${p}': No existe el archivo o el directorio` };
        if (f.has("R")) this.walk(abs, n, (_, node) => (node.owner = user));
        else n.owner = user;
      }
      return {};
    },
    whoami: (_: string[], ctx: Ctx) => ({ out: (ctx.sudo ? "root" : this.user) + "\n" }),
    id: () => ({ out: "uid=1000(tux) gid=1000(tux) grupos=1000(tux),10(wheel),27(sudo)\n" }),
    groups: () => ({ out: "tux wheel sudo\n" }),
    hostname: () => ({ out: this.hostname + "\n" }),
    uname: (args: string[]) => {
      const f = this.flags(args);
      if (f.has("r")) return { out: "6.11.4-tuxquest\n" };
      if (f.has("a")) return { out: `Linux ${this.hostname} 6.11.4-tuxquest #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux\n` };
      return { out: "Linux\n" };
    },
    date: () => ({ out: new Date().toLocaleString("es-PE", { dateStyle: "full", timeStyle: "medium" }) + "\n" }),
    uptime: () => ({ out: " 10:12:03 up 2:14,  1 user,  load average: 0,32, 0,28, 0,21\n" }),
    history: () => ({ out: this.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}\n`).join("") }),
    man: (args: string[]) => (args[0] ? { out: `${args[0].toUpperCase()}(1)        Manual del usuario        ${args[0].toUpperCase()}(1)\n\nNOMBRE\n    ${args[0]} - (manual simulado de TuxQuest)\n\nPulsa q para salir en una terminal real.\n` } : { err: "¿Qué página de manual desea?" }),
    help: () => ({
      out: "Terminal simulada de TuxQuest. Puedes usar comandos como:\nls cd pwd mkdir touch cat rm cp mv echo head tail wc grep find chmod chown\nps kill df du free ping ip systemctl tar sort uniq history clear\ny el gestor de paquetes de tu familia.\n",
    }),
    df: (args: string[]) => {
      const h = this.flags(args).has("h");
      return { out: h ? "S.ficheros      Tamaño Usados  Disp Uso% Montado en\n/dev/sda2         234G    71G  151G  32% /\n/dev/sda1         511M    32M  480M   7% /boot/efi\ntmpfs             7,8G   2,1M  7,8G   1% /tmp\n" : "S.ficheros     bloques de 1K   Usados    Disponibles Uso% Montado en\n/dev/sda2       245366784  74448896  158334976  32% /\n" };
    },
    du: (args: string[]): Res => {
      const f = this.flags(args);
      const out: string[] = [];
      for (const p of f.rest.length ? f.rest : ["."]) {
        const abs = this.resolve(p);
        const n = this.get(abs);
        if (!n) return { err: `du: no se puede acceder a '${p}': No existe el archivo o el directorio` };
        let total = 0;
        this.walk(abs, n, (_, node) => (total += fakeSize(node)));
        out.push(`${f.has("h") ? human(total) : Math.ceil(total / 1024)}\t${p}`);
      }
      return { out: out.join("\n") + "\n" };
    },
    free: (args: string[]) => ({
      out: this.flags(args).has("h")
        ? "               total       usado       libre  compartido   búf/caché  disponible\nMem:            15Gi       4,2Gi       8,1Gi       312Mi       3,0Gi        10Gi\nInter:         4,0Gi          0B       4,0Gi\n"
        : "               total       usado       libre\nMem:        16089424     4404220     8493512\nInter:       4194300           0     4194300\n",
    }),
    ps: (args: string[]) => {
      const all = args.length > 0;
      const list = all ? PROCESSES : PROCESSES.filter((p) => p.cmd.includes("bash")).concat([{ pid: 3001, user: "tux", cmd: "bash" }]);
      return { out: "USER         PID %CPU %MEM COMMAND\n" + list.map((p) => `${p.user.padEnd(8)} ${String(p.pid).padStart(7)}  0.${p.pid % 9}  1.${p.pid % 7} ${p.cmd}`).join("\n") + "\n" };
    },
    pstree: () => ({ out: "systemd(1)─┬─NetworkManager(812)\n           ├─bluetoothd(640)\n           ├─nginx(1033)\n           └─bash(3001)─┬─firefox(2210)\n                        └─python3(4321)\n" }),
    top: () => ({ out: "top - 10:12:03 up 2:14, 1 user, load average: 0,32\nTareas: 9 total, 1 ejecutar, 8 hibernar\n  PID USUARIO   %CPU %MEM ORDEN\n 2210 tux        8,1  9,4 firefox\n 4321 tux        2,0  0,8 python3\n 1033 root       0,3  0,2 nginx\n(captura estática: en una terminal real se actualiza; sal con q)\n" }),
    htop: () => this.commands.top(),
    kill: (args: string[]): Res => {
      const pids = args.filter((a) => !a.startsWith("-") && a !== "KILL");
      if (!pids.length) return { err: "kill: uso: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ..." };
      for (const p of pids) {
        if (!/^\d+$/.test(p)) return { err: `bash: kill: ${p}: argumentos no válidos: deben ser IDs de proceso o de trabajo` };
        if (!PROCESSES.some((x) => String(x.pid) === p)) return { err: `bash: kill: (${p}) - No existe el proceso` };
      }
      return {};
    },
    killall: (args: string[]) => (PROCESSES.some((p) => p.cmd.includes(args[0] ?? "\u0000")) ? {} : { err: `${args[0]}: no se ha matado ningún proceso` }),
    pkill: () => ({}),
    systemctl: (args: string[], ctx: Ctx): Res => {
      const f = this.flags(args);
      const [action, unit] = f.rest;
      if (!action || action === "list-units" || args.includes("--type=service")) {
        return { out: "  UNIT                     LOAD   ACTIVE SUB     DESCRIPTION\n  bluetooth.service        loaded active running Bluetooth service\n  NetworkManager.service   loaded active running Network Manager\n  nginx.service            loaded active running A high performance web server\n  sshd.service             loaded active running OpenSSH Daemon\n" };
      }
      const svc = (unit ?? "").replace(/\.service$/, "");
      if (["start", "stop", "restart", "reload", "enable", "disable", "poweroff", "reboot", "mask"].includes(action)) {
        if (!ctx.sudo) return { err: "Failed to " + action + " " + svc + ".service: Access denied\nSee system logs and 'systemctl status " + svc + ".service' for details." };
        if (action === "poweroff" || action === "reboot") return { out: "(simulado) El sistema se apagaría ahora.\n" };
        if (!svc) return { err: "Too few arguments." };
        if (action === "enable") return { out: `Created symlink /etc/systemd/system/multi-user.target.wants/${svc}.service → /usr/lib/systemd/system/${svc}.service.\n` };
        if (action === "disable") return { out: `Removed "/etc/systemd/system/multi-user.target.wants/${svc}.service".\n` };
        return {};
      }
      if (action === "status") {
        if (!svc) return { out: `● ${this.hostname}\n    State: running\n` };
        return { out: `● ${svc}.service - ${svc}\n     Loaded: loaded (/usr/lib/systemd/system/${svc}.service; enabled)\n     Active: active (running) since lun 2026-10-20 08:00:00; 2h 12min ago\n   Main PID: 1033\n` };
      }
      return { err: `Unknown command verb '${action}'.` };
    },
    journalctl: () => ({ out: "oct 20 08:00:01 " + this.hostname + " systemd[1]: Starting nginx.service...\noct 20 08:00:02 " + this.hostname + " systemd[1]: Started nginx.service.\n" }),
    tar: (args: string[]): Res => {
      const flags = args[0]?.replace(/^-/, "") ?? "";
      const fIdx = flags.indexOf("f");
      const rest = args.slice(1);
      if (!flags || fIdx < 0) return { err: "tar: Debe especificar una de las opciones '-Acdtrux'\nPruebe 'tar --help' para más información." };
      if (flags.includes("c")) {
        const [archive, ...srcs] = rest;
        if (!archive || !srcs.length) return { err: "tar: Rehúso crear un archivo vacío" };
        const src = this.get(this.resolve(srcs[0]));
        if (!src) return { err: `tar: ${srcs[0]}: No se puede stat: No existe el archivo o el directorio` };
        if (src.kind === "file" && !archive.includes(".tar")) return { err: `tar: ${srcs[0]}: No se puede stat: No existe el archivo o el directorio` };
        const [parent, name] = this.parentOf(this.resolve(archive));
        if (parent) parent.children[name] = file("\u0000GZIP");
        return { out: flags.includes("v") ? srcs.map((s) => s + "/\n").join("") : "" };
      }
      if (flags.includes("x")) {
        const n = this.get(this.resolve(rest[0] ?? ""));
        if (!n) return { err: `tar: ${rest[0]}: No se puede open: No existe el archivo o el directorio` };
        const cwdNode = this.get(this.cwd) as DirNode;
        cwdNode.children["proyecto"] = dir({ "README.md": file("# Proyecto extraído\n") });
        return { out: flags.includes("v") ? "proyecto/\nproyecto/README.md\n" : "" };
      }
      if (flags.includes("t")) return { out: "proyecto/\nproyecto/README.md\n" };
      return { err: "tar: opción no reconocida" };
    },
    ping: (args: string[]): Res => {
      const f = this.flags(args.filter((a) => !/^\d+$/.test(a)));
      const host = f.rest.find((a) => /[a-z.]/i.test(a));
      if (!host) return { err: "ping: destino de uso requerido" };
      const ci = args.findIndex((a) => a.startsWith("-c"));
      const n = ci >= 0 ? Number(args[ci].slice(2) || args[ci + 1]) || 4 : 5;
      const lines = Array.from({ length: Math.min(n, 10) }, (_, i) => `64 bytes from ${host} (142.250.0.${i + 10}): icmp_seq=${i + 1} ttl=117 time=${(12 + i * 0.7).toFixed(1)} ms`);
      return { out: `PING ${host} 56(84) bytes of data.\n${lines.join("\n")}\n${ci < 0 ? "^C\n" : ""}--- ${host} ping statistics ---\n${lines.length} packets transmitted, ${lines.length} received, 0% packet loss\n` };
    },
    ip: (args: string[]) => (args[0]?.startsWith("a") ? { out: "1: lo: <LOOPBACK,UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: wlan0: <BROADCAST,MULTICAST,UP> mtu 1500\n    inet 192.168.1.15/24 brd 192.168.1.255 scope global dynamic wlan0\n" } : args[0]?.startsWith("r") ? { out: "default via 192.168.1.1 dev wlan0\n" } : { err: 'Uso: ip [ OPCIONES ] OBJETO { COMANDO | help }\nPrueba "ip a"' }),
    ss: () => ({ out: "Netid State  Local Address:Port  Peer Address:Port\ntcp   LISTEN 0.0.0.0:22          0.0.0.0:*\ntcp   LISTEN 0.0.0.0:80          0.0.0.0:*\nudp   UNCONN 0.0.0.0:68          0.0.0.0:*\n" }),
    netstat: () => this.commands.ss(),
    ssh: (args: string[]) => (args.some((a) => /^[\w.-]+@\d/.test(a) || /^\d/.test(a)) ? { out: "(simulado) Conectado. En una terminal real verías el prompt del servidor remoto.\n" } : { err: `ssh: Could not resolve hostname ${args[0] ?? ""}: Name or service not known` }),
    scp: (args: string[]) => (args.length >= 2 && args[1].includes(":") ? { out: `${args[0]}                     100%  512     1.2MB/s   00:00\n` } : { err: "usage: scp [-r] origen ... usuario@host:destino" }),
    wget: (args: string[]): Res => {
      const url = args.find((a) => a.startsWith("http"));
      if (!url) return { err: "wget: falta la URL" };
      const name = url.split("/").pop() || "index.html";
      (this.get(this.cwd) as DirNode).children[name] = file("\u0000DATA");
      return { out: `--2026-10-20 10:15:00--  ${url}\nGuardando como: «${name}»\n${name}   100%[===================>]  2,4M  5,1MB/s  en 0,5s\n` };
    },
    curl: () => ({ out: "<!doctype html><title>Ejemplo</title>\n" }),
    useradd: (_: string[], ctx: Ctx) => (ctx.sudo ? {} : { err: "useradd: Permiso denegado." }),
    adduser: (_: string[], ctx: Ctx) => (ctx.sudo ? { out: "Añadiendo el usuario...\n" } : { err: "adduser: Solo root puede añadir un usuario o un grupo al sistema." }),
    usermod: (_: string[], ctx: Ctx) => (ctx.sudo ? {} : { err: "usermod: Permiso denegado." }),
    gpasswd: (args: string[], ctx: Ctx) => (ctx.sudo ? { out: `Añadiendo al usuario ${args[1]} al grupo ${args[2]}\n` } : { err: "gpasswd: Permiso denegado." }),
    passwd: () => ({ out: "(simulado) Nueva contraseña:\npasswd: contraseña actualizada correctamente\n" }),
    su: () => ({ out: "(simulado) Contraseña:\nAhora serías root. Escribe exit para volver.\n" }),
    exit: () => ({ out: "(simulado) exit\n" }),
    crontab: (args: string[]) => (args.includes("-e") ? { out: "(simulado) Se abriría el editor con tu crontab.\n" } : { out: "# m h dom mon dow command\n" }),
    shutdown: (_: string[], ctx: Ctx) => (ctx.sudo ? { out: "(simulado) El sistema se apagaría ahora.\n" } : { err: "Failed to set wall message, ignoring: Interactive authentication required.\nCall to PowerOff failed: Access denied" }),
    poweroff: (a: string[], c: Ctx) => this.commands.shutdown(a, c),
    reboot: (a: string[], c: Ctx) => this.commands.shutdown(a, c),
    which: (args: string[]) => ({ out: args.map((a) => `/usr/bin/${a}\n`).join("") }),
    nano: () => ({ out: "(simulado) Los editores de texto no están disponibles en la terminal de práctica.\n" }),
    vim: () => ({ out: "(simulado) Los editores de texto no están disponibles en la terminal de práctica.\n" }),
    lsblk: () => ({ out: "NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0 238,5G  0 disk\n├─sda1   8:1    0   512M  0 part /boot/efi\n└─sda2   8:2    0   238G  0 part /\n" }),
    fastfetch: () => ({ out: `        .--.       tux@${this.hostname}\n       |o_o |      OS: ${this.readOs()}\n       |:_/ |      Kernel: 6.11.4-tuxquest\n      //   \\ \\     Shell: bash\n     (|     | )    Terminal: TuxQuest\n    /'\\_   _/\`\\\n    \\___)=(___/\n` }),
    neofetch: () => this.commands.fastfetch(),
    getenforce: () => ({ out: "Enforcing\n" }),
    sestatus: () => ({ out: "SELinux status:                 enabled\nCurrent mode:                   enforcing\n" }),
    "firewall-cmd": (_: string[], ctx: Ctx) => (ctx.sudo ? { out: "success\n" } : { err: "Authorization failed." }),
    yast: () => ({ out: "(simulado) Se abriría el centro de control YaST.\n" }),
    "do-release-upgrade": (_: string[], ctx: Ctx) => (ctx.sudo ? { out: "Buscando una nueva versión de Ubuntu\nNo se encontró ninguna versión nueva.\n" } : { err: "Necesita ser root para ejecutar este programa." }),

    // Gestores de paquetes
    apt: (args: string[], ctx: Ctx) => this.pkg("apt", args, ctx),
    "apt-get": (args: string[], ctx: Ctx) => this.pkg("apt", args, ctx),
    "apt-cache": (args: string[], ctx: Ctx) => this.pkg("apt", args, ctx),
    dpkg: (args: string[], ctx: Ctx): Res => {
      if (args[0] === "-S" || args[0] === "--search") return { out: `coreutils: ${args[1]}\n` };
      if (args[0] === "-l" || args[0] === "--list") return { out: "ii  bash      5.2.21  amd64  GNU Bourne Again SHell\nii  coreutils 9.4     amd64  GNU core utilities\nii  firefox   131.0   amd64  Navegador web\n" };
      if (args[0] === "-i") return ctx.sudo ? this.pkgInstalled(args.slice(1)) : { err: "dpkg: error: la operación solicitada requiere privilegios de superusuario" };
      return { err: "dpkg: necesita una opción que indique qué hacer" };
    },
    pacman: (args: string[], ctx: Ctx) => this.pkg("pacman", args, ctx),
    paccache: (_: string[], ctx: Ctx) => (ctx.sudo ? { out: "==> finished: 12 packages removed (disk space saved: 420.5 MiB)\n" } : { err: "==> ERROR: Permission denied" }),
    "pacman-mirrors": (_: string[], ctx: Ctx) => (ctx.sudo ? { out: "::INFO Querying mirrors - This may take some time\n::INFO Writing mirror list\n" } : { err: "::ERROR Must have root privileges" }),
    yay: (args: string[], ctx: Ctx) => (ctx.sudo ? { err: "-> Evita ejecutar yay como root/sudo." } : this.pkg("pacman", args, { ...ctx, sudo: true })),
    paru: (args: string[], ctx: Ctx) => (ctx.sudo ? { err: "error: no ejecutes paru como root" } : this.pkg("pacman", args, { ...ctx, sudo: true })),
    pamac: (args: string[], ctx: Ctx) => (ctx.sudo ? { err: "Error: pamac no debe ejecutarse con sudo." } : args[0] === "install" ? this.pkgInstalled(args.slice(1)) : { out: "pamac: operación completada\n" }),
    dnf: (args: string[], ctx: Ctx) => this.pkg("dnf", args, ctx),
    yum: (args: string[], ctx: Ctx) => this.pkg("dnf", args, ctx),
    zypper: (args: string[], ctx: Ctx) => this.pkg("zypper", args, ctx),
    rpm: (args: string[], ctx: Ctx): Res => {
      if (args[0] === "-qf") return { out: `coreutils-9.4-1.x86_64\n` };
      if (args[0] === "-qa") return { out: "bash-5.2.26-1.x86_64\ncoreutils-9.4-1.x86_64\nfirefox-131.0-1.x86_64\n" };
      if (args[0]?.startsWith("-i") || args[0]?.startsWith("-U")) return ctx.sudo ? this.pkgInstalled(args.slice(1)) : { err: "error: no se puede abrir el índice Packages usando sqlite - Permiso denegado (13)" };
      return { err: "rpm: no se ha especificado ninguna operación" };
    },
    snap: (args: string[], ctx: Ctx) => (args[0] === "install" ? (ctx.sudo ? { out: `${args[1]} 3.0.20 de VideoLAN✓ instalado\n` } : { err: "error: acceso denegado (prueba con sudo)" }) : { out: "Name  Version  Rev  Tracking  Publisher\ncore22  20240904  1621  latest/stable  canonical✓\n" }),
    flatpak: (args: string[]) => (args[0] === "install" ? { out: `Buscando coincidencias…\nInstalando ${args[args.length - 1]}…\nInstalación completa.\n` } : { out: "Nombre  ID de aplicación  Versión  Rama\n" }),
  };

  private readOs() {
    const c = (this.get("/etc/os-release") as FileNode).content;
    return /PRETTY_NAME="(.+)"/.exec(c)?.[1] ?? "Linux";
  }

  private applyMode(perm: string, mode: string): string {
    if (/^[0-7]{3,4}$/.test(mode)) {
      return mode
        .slice(-3)
        .split("")
        .map((d) => {
          const n = Number(d);
          return (n & 4 ? "r" : "-") + (n & 2 ? "w" : "-") + (n & 1 ? "x" : "-");
        })
        .join("");
    }
    const m = /^([ugoa]*)([+\-=])([rwxX]+)$/.exec(mode)!;
    const who = m[1] === "" || m[1] === "a" ? "ugo" : m[1];
    const chars = perm.split("");
    for (const w of who) {
      const base = { u: 0, g: 3, o: 6 }[w as "u" | "g" | "o"];
      for (const p of m[3].replace("X", "x")) {
        const idx = base + { r: 0, w: 1, x: 2 }[p as "r" | "w" | "x"];
        if (m[2] === "-") chars[idx] = "-";
        else chars[idx] = p;
      }
    }
    return chars.join("");
  }

  private copyMove(args: string[], cmd: "cp" | "mv"): Res {
    const f = this.flags(args);
    if (f.rest.length < 2) return { err: f.rest.length ? `${cmd}: falta el operando de archivo de destino después de '${f.rest[0]}'` : `${cmd}: falta un operando de archivo` };
    const dest = f.rest[f.rest.length - 1];
    const srcs = f.rest.slice(0, -1);
    const destAbs = this.resolve(dest);
    const destNode = this.get(destAbs);
    const errs: string[] = [];
    for (const s of srcs) {
      const sAbs = this.resolve(s);
      const n = this.get(sAbs);
      if (!n) {
        errs.push(`${cmd}: no se puede efectuar \`stat' sobre '${s}': No existe el archivo o el directorio`);
        continue;
      }
      if (cmd === "cp" && n.kind === "dir" && !f.has("r") && !f.has("R") && !f.has("a")) {
        errs.push(`cp: -r no especificado; se omite el directorio '${s}'`);
        continue;
      }
      const [targetParent, targetName] = destNode?.kind === "dir" ? [destNode, sAbs.split("/").pop()!] : this.parentOf(destAbs);
      if (!targetParent) {
        errs.push(`${cmd}: no se puede crear '${dest}': No existe el archivo o el directorio`);
        continue;
      }
      targetParent.children[targetName] = cmd === "cp" ? structuredClone(n) : n;
      if (cmd === "mv") {
        const [sp, sn] = this.parentOf(sAbs);
        if (sp && !(sp === targetParent && sn === targetName)) delete sp.children[sn];
      }
    }
    return { err: errs.join("\n") || undefined };
  }

  private headTail(args: string[], ctx: Ctx, cmd: "head" | "tail"): Res {
    let n = 10;
    const rest: string[] = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-n") n = Number(args[++i]) || 10;
      else if (/^-n\d+$/.test(a)) n = Number(a.slice(2));
      else if (/^-\d+$/.test(a)) n = Number(a.slice(1));
      else if (a === "-f") continue;
      else rest.push(a);
    }
    const [text, err] = this.inputOf(rest, cmd, ctx);
    if (err) return { err };
    const ls = text.split("\n");
    if (ls[ls.length - 1] === "") ls.pop();
    const sel = cmd === "head" ? ls.slice(0, n) : ls.slice(-n);
    return { out: sel.map((l) => l + "\n").join("") + (args.includes("-f") ? "(esperando nuevas líneas… en una terminal real sales con Ctrl + C)\n" : "") };
  }

  private pkgInstalled(pkgs: string[]): Res {
    const names = pkgs.filter((p) => !p.startsWith("-")).map((p) => p.split("/").pop()!.replace(/^\.\//, ""));
    return { out: names.map((p) => `Instalando ${p}...`).join("\n") + "\nListo.\n" };
  }

  private pkg(pm: "apt" | "pacman" | "dnf" | "zypper", args: string[], ctx: Ctx): Res {
    const pkgs = args.filter((a) => !a.startsWith("-") && !a.startsWith("$(")).slice(pm === "pacman" ? 0 : 1);
    const list = pkgs.join(" ");
    const needRoot = (ok: () => Res): Res => (ctx.sudo ? ok() : { err: ROOT_ERRORS[pm], code: 1 });
    const installOut = (): Res => {
      if (!pkgs.length) return { err: "No se indicó ningún paquete." };
      return {
        out:
          pm === "apt"
            ? `Leyendo lista de paquetes... Hecho\nCreando árbol de dependencias... Hecho\nSe instalarán los siguientes paquetes NUEVOS:\n  ${list}\nDesempaquetando ${pkgs[0]}...\nConfigurando ${pkgs[0]}...\n`
            : pm === "pacman"
              ? `resolviendo dependencias...\nPaquetes (${pkgs.length}) ${pkgs.map((p) => p + "-1.0-1").join("  ")}\n:: ¿Continuar con la instalación? [S/n] s\n(1/1) instalando ${pkgs[0]}  [######################] 100%\n`
              : pm === "dnf"
                ? `Dependencias resueltas.\nInstalando:\n ${list}\n¿Está de acuerdo [s/N]?: s\nInstalado:\n  ${pkgs.map((p) => p + "-1.0-1.x86_64").join(" ")}\n¡Listo!\n`
                : `Cargando datos del repositorio...\nLeyendo los paquetes instalados...\nResolviendo dependencias de paquetes...\nLos siguientes paquetes NUEVOS van a ser instalados:\n  ${list}\n¿Desea continuar? [s/n/v/...? mostrar todas las opciones] (s): s\n`,
      };
    };
    const removeOut = (): Res => ({ out: pm === "pacman" ? `comprobando dependencias...\n(1/1) eliminando ${pkgs[0] ?? "libhuerfana"}  [######################] 100%\n` : `Se ELIMINARÁN los siguientes paquetes:\n  ${list}\nEliminando ${pkgs[0]}...\n` });
    const upgradeOut = (): Res => ({ out: pm === "apt" ? "Leyendo lista de paquetes... Hecho\nCalculando la actualización... Hecho\n3 actualizados, 0 nuevos se instalarán, 0 para eliminar.\n" : pm === "dnf" ? "Dependencias resueltas.\nActualizando: 3 paquetes\n¡Listo!\n" : pm === "zypper" ? "Cargando datos del repositorio...\nLos siguientes 3 paquetes van a ser actualizados.\n" : ":: Iniciando actualización completa del sistema...\n 3 paquetes actualizados\n" });
    const refreshOut = (): Res => ({ out: pm === "apt" ? "Obj:1 http://deb.debian.org stable InRelease\nLeyendo lista de paquetes... Hecho\nSe pueden actualizar 3 paquetes.\n" : pm === "zypper" ? "Recuperando metadatos del repositorio 'Main Repository'.......[hecho]\nSe han actualizado todos los repositorios.\n" : pm === "dnf" ? "Última comprobación de caducidad de metadatos: hace 0:00:02.\nfirefox.x86_64   132.0-1   updates\n" : ":: Sincronizando las bases de datos de los paquetes...\n core está actualizado\n extra está actualizado\n" });
    const searchOut = (): Res => ({ out: `${pkgs[0] ?? "paquete"}/estable 2.10.38 amd64\n  Programa ${pkgs[0] ?? ""} (resultado simulado)\n${pkgs[0] ?? "paquete"}-data 2.10.38\n  Datos de ${pkgs[0] ?? ""}\n` });
    const infoOut = (): Res => ({ out: `Nombre        : ${pkgs[0]}\nVersión       : 131.0-1\nDescripción   : ${pkgs[0] === "firefox" ? "Navegador web de Mozilla" : "Paquete de ejemplo"}\nTamaño        : 245 MiB\n` });
    const listOut = (): Res => ({ out: "bash 5.2.26-1\ncoreutils 9.4-1\nfirefox 131.0-1\ngit 2.46.0-1\n" });
    const cleanOut = (): Res => ({ out: "Limpiando la caché de paquetes... 420 MiB liberados.\n" });

    if (pm === "pacman") {
      const op = args.find((a) => /^-[A-Z]/.test(a)) ?? "";
      if (op.startsWith("-S")) {
        if (op.includes("s")) return searchOut();
        if (op.includes("i")) return infoOut();
        if (op.includes("c")) return needRoot(cleanOut);
        if (op.includes("u")) return needRoot(() => ({ out: refreshOut().out! + upgradeOut().out! + (pkgs.length ? installOut().out! : "") }));
        if (op.includes("y") && !pkgs.length) return needRoot(refreshOut);
        return needRoot(installOut);
      }
      if (op.startsWith("-R")) return needRoot(() => (pkgs.length || args.some((a) => a.startsWith("$(")) ? removeOut() : { err: "error: no se ha especificado ningún objetivo" }));
      if (op.startsWith("-U")) return needRoot(() => this.pkgInstalled(pkgs));
      if (op.startsWith("-Q")) {
        if (op.includes("o")) return { out: `${pkgs[0]} es propiedad de coreutils 9.4-1\n` };
        if (op.includes("i")) return infoOut();
        if (op.includes("d")) return { out: "libhuerfana\n" };
        return listOut();
      }
      return { err: "error: no se ha especificado ninguna operación (use -h para obtener ayuda)" };
    }

    const sub = args.find((a) => !a.startsWith("-")) ?? "";
    const verb =
      ({
        apt: { install: "install", remove: "remove", purge: "remove", autoremove: "remove", update: "refresh", upgrade: "upgrade", "full-upgrade": "upgrade", "dist-upgrade": "upgrade", search: "search", show: "info", list: "list", clean: "clean", autoclean: "clean" },
        dnf: { install: "install", in: "install", remove: "remove", erase: "remove", rm: "remove", autoremove: "remove", upgrade: "upgrade", update: "upgrade", up: "upgrade", "check-update": "check", makecache: "refresh", search: "search", info: "info", list: "list", clean: "clean", provides: "provides" },
        zypper: { install: "install", in: "install", remove: "remove", rm: "remove", refresh: "refresh", ref: "refresh", update: "upgrade", up: "upgrade", dup: "upgrade", "dist-upgrade": "upgrade", patch: "upgrade", search: "search", se: "search", info: "info", if: "info", clean: "clean", addrepo: "addrepo", ar: "addrepo" },
      } as Record<string, Record<string, string>>)[pm][sub] ?? "";

    if (pm === "apt" && args[0] === "list" && args.includes("--installed")) return listOut();
    if (pm === "zypper" && verb === "search" && (args.includes("-i") || args.includes("--installed-only"))) return listOut();
    switch (verb) {
      case "install":
        return needRoot(() => (pkgs.some((p) => p.includes("/") || /\.(deb|rpm)$/.test(p)) ? this.pkgInstalled(pkgs) : installOut()));
      case "remove":
        return needRoot(removeOut);
      case "refresh":
        return needRoot(refreshOut);
      case "check":
        return refreshOut();
      case "upgrade":
        return needRoot(upgradeOut);
      case "search":
        return searchOut();
      case "info":
        return infoOut();
      case "list":
        return listOut();
      case "clean":
        return needRoot(cleanOut);
      case "provides":
        return { out: `coreutils-9.4-1.x86_64 : Utilidades básicas de GNU\nCoincidencia en: ${pkgs[0]}\n` };
      case "addrepo":
        return needRoot(() => ({ out: `Añadiendo el repositorio '${pkgs[1] ?? "nuevo"}'.....[hecho]\n` }));
      default:
        return { err: `${pm}: orden no válida «${sub}». Prueba ${pm} --help` };
    }
  }
}
