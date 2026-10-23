import { choice, complete, fix, write } from "./builders.ts";
import type { FamilyId, Question } from "./types.ts";

interface PackageManager {
  family: FamilyId;
  familyName: string;
  pm: string;
  format: string;
  installSub: string;
  removeSub: string;
  install: (p: string) => string[];
  remove: (p: string) => string[];
  refresh: string[];
  upgrade: string[];
  search: (p: string) => string[];
  info: (p: string) => string[];
  listInstalled: string[];
  clean: string[];
  local: string[];
  localFile: string;
  owner: string[];
  rootError: string;
  noSudo: string;
}

const PMS: PackageManager[] = [
  {
    family: "debian", familyName: "Debian", pm: "apt", format: ".deb", installSub: "install", removeSub: "remove",
    install: (p) => [`sudo apt install ${p}`, `sudo apt-get install ${p}`, `sudo apt install -y ${p}`],
    remove: (p) => [`sudo apt remove ${p}`, `sudo apt-get remove ${p}`, `sudo apt purge ${p}`],
    refresh: ["sudo apt update", "sudo apt-get update"],
    upgrade: ["sudo apt upgrade", "sudo apt full-upgrade", "sudo apt update && sudo apt upgrade", "sudo apt-get upgrade"],
    search: (p) => [`apt search ${p}`, `apt-cache search ${p}`],
    info: (p) => [`apt show ${p}`, `apt-cache show ${p}`],
    listInstalled: ["apt list --installed", "dpkg -l", "dpkg --list"],
    clean: ["sudo apt clean", "sudo apt autoclean", "sudo apt-get clean"],
    local: ["sudo apt install ./discord.deb", "sudo dpkg -i discord.deb", "sudo apt install ./Descargas/discord.deb", "sudo dpkg -i Descargas/discord.deb"],
    localFile: "discord.deb",
    owner: ["dpkg -S /usr/bin/ls", "dpkg --search /usr/bin/ls"],
    rootError: "E: No se pudo abrir el fichero de bloqueo. ¿Es usted root?",
    noSudo: "apt install git",
  },
  {
    family: "arch", familyName: "Arch", pm: "pacman", format: ".pkg.tar.zst", installSub: "-S", removeSub: "-R",
    install: (p) => [`sudo pacman -S ${p}`, `sudo pacman -S --needed ${p}`, `sudo pacman -S --noconfirm ${p}`],
    remove: (p) => [`sudo pacman -R ${p}`, `sudo pacman -Rs ${p}`, `sudo pacman -Rns ${p}`],
    refresh: ["sudo pacman -Sy", "sudo pacman -Syy"],
    upgrade: ["sudo pacman -Syu", "sudo pacman -Syyu"],
    search: (p) => [`pacman -Ss ${p}`],
    info: (p) => [`pacman -Si ${p}`, `pacman -Qi ${p}`],
    listInstalled: ["pacman -Q", "pacman -Qe", "pacman -Qq"],
    clean: ["sudo pacman -Sc", "sudo pacman -Scc", "sudo paccache -r"],
    local: ["sudo pacman -U discord.pkg.tar.zst", "sudo pacman -U ./discord.pkg.tar.zst", "sudo pacman -U Descargas/discord.pkg.tar.zst"],
    localFile: "discord.pkg.tar.zst",
    owner: ["pacman -Qo /usr/bin/ls"],
    rootError: "error: no puede realizar esta operación a menos que sea root.",
    noSudo: "pacman -S git",
  },
  {
    family: "redhat", familyName: "Red Hat", pm: "dnf", format: ".rpm", installSub: "install", removeSub: "remove",
    install: (p) => [`sudo dnf install ${p}`, `sudo dnf install -y ${p}`, `sudo dnf in ${p}`, `sudo yum install ${p}`],
    remove: (p) => [`sudo dnf remove ${p}`, `sudo dnf erase ${p}`, `sudo dnf rm ${p}`, `sudo yum remove ${p}`],
    refresh: ["sudo dnf check-update", "dnf check-update", "sudo dnf makecache"],
    upgrade: ["sudo dnf upgrade", "sudo dnf update", "sudo dnf up", "sudo yum update"],
    search: (p) => [`dnf search ${p}`, `yum search ${p}`],
    info: (p) => [`dnf info ${p}`, `yum info ${p}`],
    listInstalled: ["dnf list installed", "dnf list --installed", "rpm -qa"],
    clean: ["sudo dnf clean all"],
    local: ["sudo dnf install ./discord.rpm", "sudo dnf install Descargas/discord.rpm", "sudo dnf install ./Descargas/discord.rpm", "sudo rpm -i discord.rpm"],
    localFile: "discord.rpm",
    owner: ["rpm -qf /usr/bin/ls", "dnf provides /usr/bin/ls"],
    rootError: "Error: Este comando debe ejecutarse con privilegios de superusuario.",
    noSudo: "dnf install git",
  },
  {
    family: "suse", familyName: "SUSE", pm: "zypper", format: ".rpm", installSub: "install", removeSub: "remove",
    install: (p) => [`sudo zypper install ${p}`, `sudo zypper in ${p}`, `sudo zypper install -y ${p}`],
    remove: (p) => [`sudo zypper remove ${p}`, `sudo zypper rm ${p}`],
    refresh: ["sudo zypper refresh", "sudo zypper ref"],
    upgrade: ["sudo zypper update", "sudo zypper up", "sudo zypper dup", "sudo zypper dist-upgrade"],
    search: (p) => [`zypper search ${p}`, `zypper se ${p}`],
    info: (p) => [`zypper info ${p}`, `zypper if ${p}`],
    listInstalled: ["zypper search --installed-only", "zypper se -i", "zypper search -i", "rpm -qa"],
    clean: ["sudo zypper clean", "sudo zypper clean --all", "sudo zypper clean -a"],
    local: ["sudo zypper install ./discord.rpm", "sudo zypper in ./discord.rpm", "sudo zypper install Descargas/discord.rpm", "sudo rpm -i discord.rpm"],
    localFile: "discord.rpm",
    owner: ["rpm -qf /usr/bin/ls"],
    rootError: "Se requieren privilegios de root para instalar o desinstalar paquetes.",
    noSudo: "zypper install git",
  },
];

function packageQuestions(m: PackageManager): Question[] {
  const s = { familyId: m.family };
  const id = (n: string) => `p-${m.family}-${n}`;
  const others = PMS.filter((o) => o.family !== m.family);
  const wrongFrom = others[0];
  const fmtOptions = [m.format, ...[".deb", ".rpm", ".pkg.tar.zst", ".apk"].filter((f) => f !== m.format)].slice(0, 4);

  return [
    // Fácil
    choice(id("f1"), "packages", `¿Qué gestor de paquetes usa la familia ${m.familyName}?`, [m.pm, ...others.map((o) => o.pm)],
      `Empieza con la letra «${m.pm[0]}».`, `Las distribuciones de la familia ${m.familyName} instalan programas con ${m.pm}.`, s),
    complete(id("f2"), "packages", "Instala firefox.", `sudo ___ ${m.installSub} firefox`, [m.pm],
      `Es el gestor de la familia ${m.familyName}.`, `${m.install("firefox")[0]} descarga e instala firefox con sus dependencias.`, s),
    complete(id("f3"), "packages", "Completa la acción para instalar firefox.", `sudo ${m.pm} ___ firefox`, [m.installSub],
      m.pm === "pacman" ? "En pacman, S viene de «sync»." : "La palabra en inglés para «instalar».",
      `En ${m.pm}, la acción de instalar es «${m.installSub}».`, s),
    complete(id("f4"), "packages", "Completa la acción para desinstalar vlc.", `sudo ${m.pm} ___ vlc`, [m.removeSub, ...(m.pm === "pacman" ? ["-Rs", "-Rns"] : m.pm === "zypper" ? ["rm"] : [])],
      m.pm === "pacman" ? "En pacman, R viene de «remove»." : "La palabra en inglés para «quitar».",
      `${m.remove("vlc")[0]} desinstala el programa.`, s),
    choice(id("f5"), "packages", `¿Qué comando actualiza todo el sistema en la familia ${m.familyName}?`, [m.upgrade[0], ...others.map((o) => o.upgrade[0])],
      `Busca el que usa ${m.pm}.`, `${m.upgrade[0]} actualiza todos los paquetes instalados.`, s),
    choice(id("f6"), "packages", `¿Qué formato de paquete usa la familia ${m.familyName}?`, fmtOptions,
      `Es el formato que entiende ${m.pm}.`, `Los paquetes de ${m.familyName} tienen la extensión ${m.format}.`, s),

    // Medio
    write(id("m1"), "medium", "packages", "Instala el reproductor vlc.", m.install("vlc"),
      `sudo + ${m.pm} + acción de instalar.`, `${m.install("vlc")[0]} instala vlc desde los repositorios.`, s),
    write(id("m2"), "medium", "packages", "Desinstala el programa gimp.", m.remove("gimp"),
      `sudo + ${m.pm} + acción de quitar.`, `${m.remove("gimp")[0]} elimina gimp del sistema.`, s),
    write(id("m3"), "medium", "packages", "Actualiza la lista de paquetes disponibles (sin instalar nada todavía).", m.refresh,
      m.pm === "pacman" ? "Sincroniza (S) y refresca (y)." : m.pm === "zypper" ? "Refrescar en inglés." : m.pm === "dnf" ? "Busca si hay actualizaciones." : "La acción se llama update.",
      `${m.refresh[0]} descarga la lista más reciente de paquetes de los repositorios.`, s),
    write(id("m4"), "medium", "packages", "Actualiza todos los paquetes instalados en el sistema.", m.upgrade,
      m.pm === "pacman" ? "S + y + u, todo junto." : "La acción para «mejorar» los paquetes.",
      `${m.upgrade[0]} instala las versiones nuevas de todo lo que tienes.`, s),
    write(id("m5"), "medium", "packages", "Busca en los repositorios paquetes relacionados con «gimp» (no necesitas sudo).", m.search("gimp"),
      m.pm === "pacman" ? "S de sync y s de search." : "La acción de buscar en inglés.",
      `${m.search("gimp")[0]} lista los paquetes cuyo nombre o descripción contienen «gimp».`, s),
    write(id("m6"), "medium", "packages", "Muestra la información detallada del paquete firefox (versión, tamaño, descripción).", m.info("firefox"),
      m.pm === "pacman" ? "S de sync e i de info." : m.pm === "apt" ? "apt + show." : "Información en inglés.",
      `${m.info("firefox")[0]} muestra los detalles del paquete.`, s),
    write(id("m7"), "medium", "packages", "Lista los paquetes que tienes instalados.", m.listInstalled,
      m.pm === "pacman" ? "Q de query." : "list / search con un filtro de instalados.",
      `${m.listInstalled[0]} muestra todos los paquetes instalados.`, s),

    // Difícil
    write(id("d1"), "hard", "packages", `Descargaste ${m.localFile} en la carpeta actual. Instálalo.`, m.local,
      m.pm === "pacman" ? "U de upgrade, para archivos locales." : "Indica la ruta del archivo con ./",
      `${m.local[0]} instala un paquete descargado a mano.`, s),
    write(id("d2"), "hard", "packages", "Averigua qué paquete instaló el archivo /usr/bin/ls.", m.owner,
      m.pm === "pacman" ? "Q de query y o de owner." : m.format === ".rpm" ? "rpm con la consulta -qf." : "dpkg con la opción de búsqueda -S.",
      `${m.owner[0]} dice a qué paquete pertenece un archivo.`, s),
    write(id("d3"), "hard", "packages", "Libera espacio borrando la caché de paquetes descargados.", m.clean,
      "La acción de limpiar.", `${m.clean[0]} borra los paquetes guardados en caché.`, s),
    write(id("d4"), "hard", "packages", "Instala git, curl y vim en un solo comando.", [
      ...m.install("git curl vim").slice(0, 2),
      ...m.install("git vim curl").slice(0, 1),
    ], "Los paquetes van uno tras otro separados por espacios.", "Los gestores aceptan varios paquetes a la vez.", s),
    fix(id("d5"), "packages", `Estás en una distribución de la familia ${m.familyName} y este comando no existe aquí. Corrígelo para instalar git.`,
      wrongFrom.install("git")[0], m.install("git"),
      `Usa ${m.pm}.`, `Cada familia tiene su gestor: aquí es ${m.pm}, no ${wrongFrom.pm}.`, s),
    fix(id("d6"), "packages", `Querías instalar git, pero te sale: «${m.rootError}»`, m.noSudo, m.install("git"),
      "Instalar programas es tarea del administrador.", "Los gestores de paquetes necesitan sudo para instalar o quitar programas.", s),
  ];
}

const DISTRO_SPECIFIC: Question[] = [
  // Debian
  choice("x-ubuntu-f1", "packages", "¿Qué formato universal de paquetes viene preinstalado en Ubuntu?", ["Snap", "Flatpak", "AppImage", "AUR"],
    "Lo creó Canonical, la empresa detrás de Ubuntu.", "Ubuntu trae Snap por defecto: sudo snap install programa.", { familyId: "debian", distroId: "ubuntu" }),
  write("x-ubuntu-m1", "medium", "packages", "Instala VLC como paquete snap.", ["sudo snap install vlc"],
    "sudo + snap + install.", "snap instala aplicaciones empaquetadas con todas sus dependencias.", { familyId: "debian", distroId: "ubuntu" }),
  write("x-ubuntu-d1", "hard", "system", "Actualiza Ubuntu a la siguiente versión de la distribución.", ["sudo do-release-upgrade"],
    "do + release + upgrade.", "do-release-upgrade pasa, por ejemplo, de Ubuntu 24.04 a 26.04.", { familyId: "debian", distroId: "ubuntu" }),
  choice("x-mint-f1", "packages", "¿Qué formato universal de aplicaciones viene integrado en Linux Mint?", ["Flatpak", "Snap", "AUR", "RPM"],
    "Mint desactiva Snap por defecto.", "Linux Mint integra Flatpak en su gestor de software.", { familyId: "debian", distroId: "mint" }),
  write("x-mint-m1", "medium", "packages", "Instala Spotify desde Flathub usando flatpak.", ["flatpak install flathub com.spotify.Client", "flatpak install com.spotify.Client"],
    "flatpak install + repositorio + id de la aplicación.", "Los flatpaks se identifican con un id del tipo com.empresa.App.", { familyId: "debian", distroId: "mint" }),
  write("x-debian-m1", "medium", "permissions", "En Debian puede que sudo no esté configurado. Conviértete en root con su.", ["su -", "su", "su - root", "su root"],
    "switch user.", "su - pide la contraseña de root y abre su sesión con su entorno.", { familyId: "debian", distroId: "debian" }),
  // Arch
  choice("x-arch-f1", "packages", "¿Cómo se llama el repositorio comunitario de Arch con miles de paquetes extra?", ["AUR", "PPA", "EPEL", "OBS"],
    "Arch User Repository.", "El AUR contiene recetas de la comunidad; se usa con ayudantes como yay o paru.", { familyId: "arch" }),
  write("x-arch-d1", "hard", "packages", "Elimina los paquetes huérfanos (dependencias que ya nadie usa).", ["sudo pacman -Rns $(pacman -Qdtq)", "sudo pacman -Rns $(pacman -Qtdq)"],
    "Combina pacman -Rns con la lista que da pacman -Qdtq.", "pacman -Qdtq lista los huérfanos y $(…) se los pasa a pacman -Rns.", { familyId: "arch" }),
  choice("x-endeavour-f1", "packages", "¿Qué ayudante del AUR viene preinstalado en EndeavourOS?", ["yay", "pamac", "apt", "zypper"],
    "Tres letras, suena a celebración.", "EndeavourOS trae yay para instalar paquetes del AUR.", { familyId: "arch", distroId: "endeavouros" }),
  write("x-endeavour-m1", "medium", "packages", "Instala google-chrome desde el AUR con yay (sin sudo: yay lo pide cuando hace falta).", ["yay -S google-chrome"],
    "Igual que pacman, pero con yay.", "yay usa la misma sintaxis que pacman y además busca en el AUR.", { familyId: "arch", distroId: "endeavouros" }),
  write("x-cachy-m1", "medium", "packages", "Instala visual-studio-code-bin desde el AUR con paru.", ["paru -S visual-studio-code-bin"],
    "Igual que pacman -S, pero con paru.", "CachyOS incluye paru, un ayudante del AUR con sintaxis de pacman.", { familyId: "arch", distroId: "cachyos" }),
  choice("x-cachy-f1", "system", "¿Cuál es la característica principal de CachyOS?", ["Paquetes optimizados para mayor rendimiento", "Usar apt como gestor", "Ser una versión de Fedora", "No tener terminal"],
    "Su nombre viene de «caché».", "CachyOS compila sus paquetes con optimizaciones para procesadores modernos.", { familyId: "arch", distroId: "cachyos" }),
  write("x-manjaro-m1", "medium", "packages", "Instala firefox con pamac, la herramienta propia de Manjaro.", ["pamac install firefox"],
    "pamac + install.", "pamac es el gestor de Manjaro; pide la contraseña por sí mismo, no uses sudo.", { familyId: "arch", distroId: "manjaro" }),
  write("x-manjaro-d1", "hard", "packages", "Ordena los servidores espejo de Manjaro por velocidad.", ["sudo pacman-mirrors --fasttrack", "sudo pacman-mirrors -f"],
    "pacman-mirrors con la opción fasttrack.", "pacman-mirrors --fasttrack elige los espejos más rápidos.", { familyId: "arch", distroId: "manjaro" }),
  // Red Hat
  write("x-fedora-m1", "medium", "packages", "Instala Spotify desde Flathub usando flatpak.", ["flatpak install flathub com.spotify.Client", "flatpak install com.spotify.Client"],
    "flatpak install + repositorio + id de la aplicación.", "Fedora integra Flatpak; Flathub es el repositorio principal.", { familyId: "redhat", distroId: "fedora" }),
  write("x-redhat-d1", "hard", "permissions", "La familia Red Hat usa SELinux. Muestra su modo actual.", ["getenforce", "sestatus"],
    "get + enforce.", "getenforce responde Enforcing, Permissive o Disabled.", { familyId: "redhat" }),
  write("x-rocky-m1", "medium", "packages", "Activa el repositorio EPEL (paquetes extra) en Rocky Linux.", ["sudo dnf install epel-release", "sudo dnf install -y epel-release"],
    "Se instala como un paquete llamado epel-release.", "EPEL añade miles de paquetes que no vienen en los repositorios base.", { familyId: "redhat", distroId: "rocky" }),
  write("x-alma-m1", "medium", "packages", "Activa el repositorio EPEL (paquetes extra) en AlmaLinux.", ["sudo dnf install epel-release", "sudo dnf install -y epel-release"],
    "Se instala como un paquete llamado epel-release.", "EPEL añade miles de paquetes que no vienen en los repositorios base.", { familyId: "redhat", distroId: "alma" }),
  write("x-rocky-d1", "hard", "network", "Abre el puerto http en el firewall de forma permanente.", ["sudo firewall-cmd --permanent --add-service=http", "sudo firewall-cmd --add-service=http --permanent"],
    "firewall-cmd con --permanent y --add-service.", "En la familia Red Hat el firewall se gestiona con firewall-cmd. Luego aplica con --reload.", { familyId: "redhat", distroId: "rocky" }),
  // SUSE
  choice("x-suse-f1", "system", "¿Cómo se llama la herramienta clásica de configuración de openSUSE?", ["YaST", "Synaptic", "Pamac", "Cockpit"],
    "Yet another Setup Tool.", "YaST configura casi todo el sistema, en modo gráfico o en la terminal.", { familyId: "suse" }),
  write("x-tumble-m1", "medium", "packages", "Actualiza Tumbleweed de la forma recomendada para una distribución rolling.", ["sudo zypper dup", "sudo zypper dist-upgrade"],
    "dup = distribution upgrade.", "En Tumbleweed se usa zypper dup, que puede cambiar versiones y dependencias.", { familyId: "suse", distroId: "tumbleweed" }),
  write("x-leap-m1", "medium", "packages", "Aplica las actualizaciones de Leap dentro de su versión.", ["sudo zypper update", "sudo zypper up", "sudo zypper patch"],
    "update o patch.", "En Leap, zypper update (o patch) actualiza sin cambiar de versión.", { familyId: "suse", distroId: "leap" }),
  write("x-suse-d1", "hard", "packages", "Añade el repositorio https://download.opensuse.org/repositories/games/ con el alias games.",
    ["sudo zypper addrepo https://download.opensuse.org/repositories/games/ games", "sudo zypper ar https://download.opensuse.org/repositories/games/ games"],
    "zypper addrepo URL alias.", "zypper addrepo (ar) agrega un repositorio con un nombre corto.", { familyId: "suse" }),
];

export const PACKAGE_QUESTIONS: Question[] = [...PMS.flatMap(packageQuestions), ...DISTRO_SPECIFIC];

export const PACKAGE_MANAGERS = Object.fromEntries(PMS.map((m) => [m.family, { pm: m.pm, rootError: m.rootError }])) as Record<
  FamilyId,
  { pm: string; rootError: string }
>;
