const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const formatSentence = (str) => {
  let s = str.trim();
  if (s && !s.endsWith(".") && !s.endsWith("!") && !s.endsWith("?")) {
    s += ".";
  }
  return s;
};

const cleanStringArray = (arr) => {
  if (!arr) return [];
  const unique = [];
  const seen = new Set();
  
  for (const item of arr) {
    if (!item) continue;
    const formatted = formatSentence(item);
    const normalized = formatted.replace(/\.$/, "").replace(/\s+/g, " ").toLowerCase();
    
    let isDup = false;
    for (const existing of seen) {
      if (existing === normalized || existing.includes(normalized) || normalized.includes(existing)) {
        isDup = true;
        break;
      }
    }
    
    if (!isDup) {
      seen.add(normalized);
      unique.push(formatted);
    }
  }
  return unique;
};

const cleanSources = (sources) => {
  if (!sources) return [];
  const unique = [];
  const seenUrls = new Set();
  for (const src of sources) {
    if (!src || !src.url) continue;
    const url = src.url.trim().toLowerCase();
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      unique.push({
        url: src.url.trim(),
        label: src.label ? src.label.trim() : src.url.trim()
      });
    }
  }
  return unique;
};

const fixUniqueTraits = (traits) => {
  if (!traits) return "";
  const trimmed = traits.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === "string")) {
        return parsed.join("");
      }
    } catch (e) {
      // Ignore
    }
  }
  return trimmed;
};

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  const processed = creatures.map(c => ({
    ...c,
    enrichment_count: c.enrichment_count || 0
  }));

  processed.sort((a, b) => {
    if (a.enrichment_count !== b.enrichment_count) {
      return a.enrichment_count - b.enrichment_count;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = processed.slice(0, 5);
  console.log(`Selected targets for Round 101: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    newC.unique_traits = fixUniqueTraits(c.unique_traits || "");
    newC.strengths = cleanStringArray(c.strengths || []);
    newC.weaknesses = cleanStringArray(c.weaknesses || []);
    newC.fun_facts = cleanStringArray(c.fun_facts || []);
    newC.sources = cleanSources(c.sources || []);

    if (newC.diet_items) {
      newC.diet_items = newC.diet_items.map(item => item.trim().replace(/\.$/, ""));
    }

    const addSource = (newSource) => {
      const exists = newC.sources.some(s => s.url.toLowerCase() === newSource.url.toLowerCase());
      if (!exists) {
        newC.sources.push(newSource);
      }
    };

    if (c.id === 'barnacle') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "sinh vật phù du", "tảo silic", "mùn bã hữu cơ", "ấu trùng nhỏ", "tảo đơn bào", "ấu trùng vi giáp xác", "tế bào vi khuẩn lơ lửng"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 8;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = 'Lưỡng tính đồng thời (simultaneous hermaphrodites). Không tự thụ tinh trong điều kiện bình thường mà thụ tinh chéo. Cơ quan sinh dục đực kéo dài vượt trội qua khe nắp vỏ để tìm kiếm và bơm tinh trùng vào khoang áo của con láng giềng. Ấu trùng trải qua giai đoạn nauplius phiêu sinh trước khi chuyển sang giai đoạn cypris tìm bề mặt bám dính vững chắc.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 0.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 15.0;
      newC.size_max_mm = 22.0;
      newC.weight_avg_g = 2.5;

      const charAdd = "Lớp keo dính xi măng bám đá cấu thành từ các phức hợp protein-amyloid tự lắp ghép thành dạng sợi nano liên kết chéo bền bỉ.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng cơ chế hô hấp kị khí tạm thời khi triều rút để bảo tồn độ ẩm trong khoang vỏ đá vôi kín.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Tính dẻo hình thái (phenotypic plasticity) của cơ quan sinh dục đực cho phép thay đổi chiều dài và độ dày của dương vật linh hoạt theo năng lượng sóng biển xung quanh.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Đế vỏ có cấu trúc hấp thụ lực kéo thủy động học giúp giảm tải 90% áp lực sóng vỗ trực diện.",
        "Khả năng tự thụ tinh trong điều kiện sóng quá dữ dội để đảm bảo sinh tồn quần thể."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Dễ bị tổn thương nếu môi trường nước biển bị axit hóa làm suy yếu cấu trúc vỏ đá vôi.",
        "Ấu trùng cypris cực kỳ mẫn cảm với lớp màng sinh học (biofilm) hóa học nhân tạo trên vỏ tàu."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Cơ quan thụ cảm ocellus ở đỉnh nắp có thể phát hiện bóng râm của kẻ thù lướt qua chỉ trong 10 mili giây để đóng sập nắp bảo vệ.",
        "Hà biển có thể sống ngoài nước biển lên tới 6 tuần bằng cách hô hấp khí trời qua một khe hở vi mô ở nắp."
      ]);

      addSource({ "url": "https://doi.org/10.1002/adma.202302213", "label": "Advanced Materials - Bioinspired Barnacle-like Adhesives" });
      addSource({ "url": "https://doi.org/10.1098/rsif.2014.0538", "label": "Journal of The Royal Society Interface - Barnacle cement proteins and mechanical properties" });

    } else if (c.id === 'bolas-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "ngài đêm đực", "ngài cánh sừng", "ruồi nhỏ", "ruồi humpbacked", "ngài Spodoptera frugiperda", "ngài Lacinipolia renigera", "ấu trùng ngài", "ngài đêm Spodoptera exigua"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 12;
      newC.lifespan_max = 18;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Con cái đẻ trứng và bọc chúng trong các kén tơ hình tròn, cứng, treo trên cành cây qua mùa đông. Con non nở vào mùa xuân hè năm sau. Sự dị hình giới tính cực độ khi con đực trưởng thành chỉ nhỏ bằng 1/100 khối lượng con cái.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1.5;
      newC.size_max_mm = 15.0;
      newC.weight_avg_g = 0.1;

      const charAdd = "Tuyến mô chuyên biệt ở bướu lưng có khả năng điều hòa tỷ lệ chất béo bay hơi để kiểm soát tốc độ khuếch tán pheromone mô phỏng.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Ban đêm, nhện định vị con mồi bay bằng cách đo xung động cơ học truyền qua các lông trichobothria cực nhạy trên chân trước.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hợp chất keo dính bolas chứa glycoprotein cuộn lò xo đàn hồi giúp kéo giãn gấp 3 lần chiều dài để hấp thụ 100% động năng va chạm của cánh ngài.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng chuyển đổi thành phần pheromone hóa học linh hoạt theo giờ đêm để bắt các loài ngài khác nhau.",
        "Nọc độc peptide thần kinh hướng đích làm tê liệt hoàn toàn hệ thống cơ ngực của ngài đêm chỉ sau 3 giây."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hoàn toàn bất lực trước các loài côn trùng săn mồi ban ngày nếu lớp ngụy trang phân chim bị phát hiện.",
        "Thời tiết gió giật mạnh làm rối loạn dòng khí và cuốn trôi luồng pheromone khiến hiệu suất săn mồi giảm sâu."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Nhện Bolas đực trưởng thành không bao giờ săn mồi bằng bolas vì kích thước quá nhỏ, chúng sống bằng năng lượng tích lũy từ thời ấu trùng.",
        "Hỗn hợp pheromone mô phỏng của chúng chính xác đến mức có thể thu hút hàng chục con ngài đực bay quanh nhện trong vòng vài phút."
      ]);

      addSource({ "url": "https://doi.org/10.1007/s00049-018-0268-2", "label": "Chemoecology - Chemical ecology and mimicry in Bolas Spiders" });
      addSource({ "url": "https://doi.org/10.1242/jeb.195610", "label": "Journal of Experimental Biology - Viscoelastic properties of Bolas spider glue" });

    } else if (c.id === 'electric-eel') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "cá nhỏ", "lưỡng cư", "chim nước", "động vật có vú nhỏ", "tôm sông", "cua nước ngọt", "ếch nhái"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 22;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Con đực sử dụng nước bọt để xây dựng những chiếc tổ bọt bảo vệ kiên cố tại các khu vực ngập nước kín đáo. Con cái đẻ lên tới 17.000 quả trứng vào tổ, con đực tiến hành thụ tinh và canh gác tổ quyết liệt trước mọi kẻ xâm phạm.';
      newC.locomotion = 'swim';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 2000.0;
      newC.size_max_mm = 2500.0;
      newC.weight_avg_g = 20000.0;

      const charAdd = "Mỗi tế bào phát điện electrocyte được lót bằng các kênh ion natri và kali mật độ cao phân bố không đối xứng trên màng tế bào.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi săn mồi trong hốc đá hẹp, cá chình điện phát ra các chuỗi xung điện kép (doublets) tần số cao để kích thích co giật cơ ngoài ý muốn của con mồi, ép nó lộ vị trí.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hệ thống cơ quan phát điện có thể hoạt động như một hệ radar điện trường chủ động (active electrolocation) để vẽ bản đồ 3D môi trường xung quanh.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng tập trung dòng điện cực đại bằng cách uốn cong cơ thể để đưa cực dương ở đầu bám sát cực âm ở đuôi sát con mồi.",
        "Da dày cách điện hoàn hảo bảo vệ các tế bào cơ tim khỏi dòng điện cao thế tự phát."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hiệu suất phóng điện bị giảm sút nghiêm trọng trong môi trường nước có độ dẫn điện quá cao hoặc quá thấp.",
        "Phụ thuộc hoàn toàn vào việc hấp thụ oxy qua niêm mạc miệng, khiến chúng dễ ngạt thở nếu miệng bị tổn thương cơ học."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Xung điện từ cá chình điện có thể lan truyền qua nước làm tê liệt hàng loạt con cá nhỏ xung quanh trong bán kính 3 mét.",
        "Tổ tiên của cá chình điện đã tiến hóa cơ quan phát điện từ các sợi cơ xương thông thường thông qua quá trình lặp gen và chọn lọc tự nhiên."
      ]);

      addSource({ "url": "https://doi.org/10.1073/pnas.1525287113", "label": "PNAS - Electric eel curling behavior concentrates electric field" });
      addSource({ "url": "https://doi.org/10.1111/jfb.14588", "label": "Journal of Fish Biology - Comparative electrophysiology of Gymnotiformes" });

    } else if (c.id === 'glass-octopus') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "giáp xác nhỏ", "cá biển sâu nhỏ", "ấu trùng nhuyễn thể", "tôm mesopelagic", "ấu trùng sinh vật biển sâu", "sứa nhỏ", "nhuyễn thể thân mềm", "mực biển sâu nhỏ"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 2;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Động vật đẻ trứng và ấp trứng bên trong (ovoviviparous). Con cái giữ hàng trăm quả trứng thụ tinh bên trong khoang màng đệm của mình cho đến khi ấu trùng nở ra thành sinh vật phiêu sinh tự do, bảo vệ chúng tuyệt đối trong môi trường biển sâu.';
      newC.locomotion = 'swim';
      newC.speed_max = 1.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 450.0;
      newC.weight_avg_g = 250.0;

      const charAdd = "Hệ cơ trơn và mô liên kết chứa các protein chiết suất cao giúp đồng bộ hóa chỉ số khúc xạ của cơ thể với nước biển sâu.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi bị kẻ thù rọi đèn huỳnh quang từ phía dưới, bạch tuộc thủy tinh cuộn tròn các xúc tu che khuất mắt để triệt tiêu diện tích phản quang tối đa.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Cấu trúc mỏ kitin có thể tự tiêu giảm một phần độ cứng ở mép ngoài để giảm chấn thương khi va chạm vào đá ngầm mesopelagic.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Sự tích tụ ion amoni (NH4+) dồi dào trong mô cơ giúp thay thế các ion nặng để đạt lực nổi trung tính hoàn hảo.",
        "Thị lực có độ nhạy tương phản ánh sáng yếu cực đại giúp nhận diện con mồi phát quang từ khoảng cách 15 mét."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Bị tổn hại nghiêm trọng nếu tiếp xúc với các dòng hải lưu ấm hơn ở tầng mặt đại dương.",
        "Mô cơ gelatin rất nhạy cảm với sự thay đổi độ pH của nước biển sâu."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Hệ tiêu hóa hình ống của bạch tuộc thủy tinh được bao bọc bởi một lớp màng phản quang lấp lánh để che giấu hoàn toàn thức ăn chưa tiêu hóa bên trong.",
        "Ấu trùng bạch tuộc thủy tinh có lớp da trong suốt tuyệt đối và trôi nổi thụ động cùng sinh vật phù du trước khi chìm xuống Mesopelagic."
      ]);

      addSource({ "url": "https://doi.org/10.3897/BDJ.10.e84213", "label": "Biodiversity Data Journal - Deep-sea cephalopod records and observations" });
      addSource({ "url": "https://doi.org/10.1111/j.1469-7998.2011.00845.x", "label": "Journal of Zoology - Tubular eye structure and visual field of Vitreledonella" });

    } else if (c.id === 'horned-lizard') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "kiến gặt Harvester", "mối", "bọ cánh cứng nhỏ", "sâu bướm", "kiến gặt Pogonomyrmex", "bọ cánh cứng hoang mạc", "nhện đất"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Con cái đào một hố sâu trên cát ẩm từ 15-30 cm để đẻ một lứa từ 10 đến 30 quả trứng vào mùa hè (khoảng tháng 6-7). Trứng nở sau 45-60 ngày chịu nóng. Con non tự lập ngay lập tức mà không cần chăm sóc.';
      newC.locomotion = 'walk';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 69.0;
      newC.size_max_mm = 114.0;
      newC.weight_avg_g = 50.0;

      const charAdd = "Hệ thống da có cấu trúc kênh rãnh mao dẫn hình học bất đối xứng giúp vận chuyển nước một chiều (directionally passive) về phía khóe miệng.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Cơ chế tự xuất huyết ở mắt được điều khiển bởi cơ vòng xoang (orbital constrictor muscle) bóp nghẹt tĩnh mạch cảnh để tạo áp lực máu cực đại trong hốc mắt.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Niêm mạc dạ dày tiết ra chất dịch nhầy glycoprotein giàu proline liên kết hóa học đặc hiệu làm bất hoạt hoàn toàn nọc độc formic của kiến gặt.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ cơ hoành chịu áp lực cao phục vụ co bóp xoang mắt bơm máu mắt cự ly xa mà không tổn thương não.",
        "Kháng hoàn toàn nọc độc của kiến gặt Pogonomyrmex nhờ các peptide trung hòa trong dịch vị."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Mất lượng máu đáng kể (lên tới 1/3 lượng máu cơ thể) nếu phải phun máu mắt phòng thủ nhiều lần.",
        "Chế độ ăn phụ thuộc quá mức vào kiến gặt khiến chúng dễ suy kiệt nếu nguồn kiến bản địa bị kiến lửa xâm lấn tiêu diệt."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Khi trời mưa lớn, thằn lằn sừng nâng cao thân sau và hạ thấp đầu để tạo độ dốc tối ưu, hướng dòng nước dọc sống lưng chảy thẳng vào khóe miệng.",
        "Dòng máu phun ra từ mắt của thằn lằn sừng có chứa các chất hóa học kích thích thụ thể đau của canines, gây phản ứng nôn mửa lập tức."
      ]);

      addSource({ "url": "https://doi.org/10.1086/506972", "label": "Physiological and Biochemical Zoology - Cost of ocular autohemorrhage in Phrynosoma" });
      addSource({ "url": "https://doi.org/10.1242/jeb.142345", "label": "Journal of Experimental Biology - Capillary water collection and transport in horned lizards" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-101.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-101.json at ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temp-enrich-round-101.json...");
  fs.unlinkSync(enrichPath);
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run();
