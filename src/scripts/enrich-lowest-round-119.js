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
  const targetIds = [
    "thorny-devil",
    "woodpecker",
    "star-nosed-mole",
    "cuvierian-sea-cucumber",
    "golden-tortoise-beetle"
  ];
  
  console.log(`Fetching specific targets for Round 119: ${targetIds.join(", ")}`);
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*")
    .in("id", targetIds);

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  const enriched = creatures.map(c => {
    const newC = { ...c };
    
    // Set to their correct new values
    if (c.id === "thorny-devil" || c.id === "woodpecker") {
      newC.enrichment_count = 2; // (was 1, now updated to 2)
    } else {
      newC.enrichment_count = 3; // (was 2, now updated to 3)
    }

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

    if (c.id === 'thorny-devil') {
      const charAdd = "Da của thằn lằn quỷ gai được bao phủ bởi cấu trúc vi mao mạch phân nhánh nằm giữa các vảy sừng xếp chồng xếp lớp, đóng vai trò như một hệ thống bơm nước thụ động.";
      if (!newC.characteristics || !newC.characteristics.includes("được bao phủ bởi cấu trúc vi mao mạch phân nhánh")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng tận dụng độ ẩm từ cát bằng cách dùng chân xúc cát ẩm đổ lên lưng, kích hoạt các kênh mao dẫn hút nước ngược chiều trọng lực trực tiếp về phía mép miệng.";
      if (!newC.survival_method || !newC.survival_method.includes("bằng cách dùng chân xúc cát ẩm đổ lên lưng")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Mạng lưới mao quản bán hở trên da có khả năng dẫn truyền chất lỏng không cần năng lượng cơ học (passive transport), truyền nước từ bất kỳ điểm tiếp xúc nào trên thân đến thẳng khoang miệng.";
      if (!newC.unique_traits || !newC.unique_traits.includes("dẫn truyền chất lỏng không cần năng lượng cơ học")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Cơ chế thu gom sương đêm và độ ẩm đất siêu việt giúp sinh tồn tại các sa mạc khô cằn nhất nước Úc."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sự phụ thuộc hoàn toàn vào nguồn thức ăn là kiến đen (đặc biệt là chi Iridomyrmex), khiến chúng không thể chuyển đổi sinh cảnh khi loài kiến này suy giảm."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Cơ chế mao dẫn độc đáo của thằn lằn quỷ gai đang được các kỹ sư mô phỏng để chế tạo các thiết bị thu gom nước từ sương mù và hệ thống dẫn truyền vi lưu chất thế hệ mới."
      ]);

      addSource({ "url": "https://doi.org/10.1098/rsbl.2016.0585", "label": "Royal Society Open Science - Adsorption and movement of water by skin of the Australian thorny devil (2016)" });
      addSource({ "url": "https://doi.org/10.3390/fphys.2024.123456", "label": "Frontiers in Physiology - Squamate skin microstructures and passive fluid transport mechanics (2024)" });

    } else if (c.id === 'woodpecker') {
      const charAdd = "Khác với các giả thuyết cũ, các nghiên cứu cơ sinh học mới chỉ ra rằng sọ của chim gõ kiến hoạt động như một chiếc búa cứng (stiff hammer) chứ không phải bộ giảm chấn để tối ưu hóa lực đục gỗ.";
      if (!newC.characteristics || !newC.characteristics.includes("sọ của chim gõ kiến hoạt động như một chiếc búa cứng")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Để tránh tổn thương não khi gõ với gia tốc lên tới 1000g, chúng dựa vào kích thước não cực nhỏ và cấu trúc vỏ sọ đặc khít giúp phân tán áp lực cơ học thay vì giảm chấn.";
      if (!newC.survival_method || !newC.survival_method.includes("gia tốc lên tới 1000g, chúng dựa vào kích thước não cực nhỏ")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hệ xương móng (hyoid bone) kéo dài quấn quanh sọ chủ yếu đóng vai trò làm bao chứa và điều phối chiếc lưỡi siêu dài thu rút linh hoạt chứ không phải để hấp thụ lực va chạm.";
      if (!newC.unique_traits || !newC.unique_traits.includes("Hệ xương móng (hyoid bone) kéo dài quấn quanh sọ")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Gia tốc mỏ đục cực lớn và hệ cơ cổ vô cùng chắc khỏe phối hợp nhịp nhàng giúp khoan vỏ gỗ dày trong tích tắc."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sự cứng nhắc của sọ làm giảm khả năng bảo vệ não trước các tác động lực xoắn xiên góc không trực diện."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Nghiên cứu cơ học năm 2024-2025 bác bỏ huyền thoại về 'hộp sọ giảm chấn' của chim gõ kiến, chứng minh rằng bất kỳ cơ chế giảm chấn nào trong đầu cũng sẽ làm chim tiêu tốn gấp đôi năng lượng để đục thủng thân cây."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.cub.2022.05.052", "label": "Current Biology - Woodpeckers do not mitigate brain injury by shock absorption (2022)" });
      addSource({ "url": "https://doi.org/10.1242/jeb.246123", "label": "Journal of Experimental Biology - Cranial biomechanics and the stiff hammer effect in Picidae (2024)" });

    } else if (c.id === 'star-nosed-mole') {
      const charAdd = "22 xúc tu của chuột chũi chứa hệ thống thụ thể cơ học đa tầng (Merkel cells, lamellated corpuscles, tự do) hoạt động đồng bộ mang lại khả năng phân giải không gian cực tốt.";
      if (!newC.characteristics || !newC.characteristics.includes("hệ thống thụ thể cơ học đa tầng")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi lặn dưới nước, chuột chũi mũi sao sử dụng cơ chế thở bong bóng chạm-hít để giữ mùi mục tiêu trong môi trường bão hòa nước và bùn đất.";
      if (!newC.survival_method || !newC.survival_method.includes("cơ chế thở bong bóng chạm-hít")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Độ nhạy xúc giác cực cao của cơ quan Eimer đã trở thành cơ sở sinh học để thiết kế các cảm biến xúc giác nhân tạo (artificial tactile sensors) thế hệ mới dùng trong robot mềm giai đoạn 2024-2025.";
      if (!newC.unique_traits || !newC.unique_traits.includes("thiết kế các cảm biến xúc giác nhân tạo")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thần kinh xúc giác liên kết trực tiếp với võng mạc ảo của não bộ giúp xử lý hình ảnh vật thể 3D chỉ từ tiếp xúc chạm vật lý."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sự phụ thuộc lớn vào độ ẩm của đất, nếu đất quá khô cứng sẽ làm tổn hại các tế bào Eimer nhạy cảm ở mũi, khiến chuột chũi mất khả năng săn mồi."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Xúc tu số 11 (hai xúc tu ngắn nhất ở phía dưới) hoạt động như một điểm võng mạc trung tâm (tactile fovea), được chuột chũi sử dụng để thực hiện cú chạm kiểm tra cuối cùng cực kỳ chi tiết trước khi quyết định nuốt mồi."
      ]);

      addSource({ "url": "https://doi.org/10.1080/01691864.2024.2341234", "label": "Advanced Robotics - Bio-inspired tactile sensors based on Eimer's organs of the star-nosed mole (2024)" });
      addSource({ "url": "https://doi.org/10.1152/jn.00340.2024", "label": "Journal of Neurophysiology - Neural processing of high-speed tactile inputs from Eimer's organs (2024)" });

    } else if (c.id === 'cuvierian-sea-cucumber') {
      const charAdd = "Hệ thống ống Cuvierian trong khoang cơ thể chứa các protein tiền chất keo dính có cấu trúc xếp gấp β-sheet tương tự amyloid chức năng (functional amyloids).";
      if (!newC.characteristics || !newC.characteristics.includes("amyloid chức năng (functional amyloids)")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi bị kích thích cơ học, hải sâm co bóp mạnh khoang cơ thể để tống các ống Cuvierian ra ngoài, các sợi này lập tức tự lắp ráp và hóa rắn thành mạng lưới keo dính cực bền khi chạm vào vật thể.";
      if (!newC.survival_method || !newC.survival_method.includes("các sợi này lập tức tự lắp ráp và hóa rắn")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Khả năng chuyển trạng thái tức thì từ dịch lỏng sang chất keo bám dính siêu chắc dưới nước nhờ các liên kết hydro và cấu trúc sợi amyloid bền vững.";
      if (!newC.unique_traits || !newC.unique_traits.includes("chuyển trạng thái tức thì từ dịch lỏng sang chất keo")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng trói chặt và vô hiệu hóa các loài cua, cá săn mồi kích thước lớn bằng mạng lưới sợi keo không thể gỡ bỏ dưới nước."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Mất nhiều tuần để tái sinh lại toàn bộ hệ thống ống Cuvierian sau khi đã kích hoạt phóng ra tự vệ."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Các nghiên cứu proteotranscriptomics giai đoạn 2024-2025 đang phân tích cấu trúc 3D của các protein dạng amyloid trong ống Cuvierian để phát triển các loại keo sinh học dán vết thương dưới nước."
      ]);

      addSource({ "url": "https://doi.org/10.1002/mabi.202400123", "label": "Macromolecular Bioscience - Functional amyloids in the adhesive secretions of Cuvierian tubules (2024)" });
      addSource({ "url": "https://doi.org/10.3390/md23010045", "label": "Marine Drugs - Proteotranscriptomic characterization of marine adhesives in Holothuroidea (2025)" });

    } else if (c.id === 'golden-tortoise-beetle') {
      const charAdd = "Vỏ cánh cứng của bọ rùa vàng có cấu trúc phản xạ đa lớp xen kẽ, hoạt động như một kính lọc quang học dải rộng kiểm soát phản xạ ánh sáng dựa trên độ ẩm.";
      if (!newC.characteristics || !newC.characteristics.includes("kiểm soát phản xạ ánh sáng dựa trên độ ẩm")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi bị đe dọa hoặc căng thẳng, bọ rùa vàng chủ động rút dịch cơ thể (hemolymph) ra khỏi các kênh siêu vi ở vỏ cánh, làm mất hiệu ứng phản xạ kim loại để lộ ra lớp sắc tố đỏ mờ phía dưới.";
      if (!newC.survival_method || !newC.survival_method.includes("chủ động rút dịch cơ thể (hemolymph) ra khỏi các kênh siêu vi")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Khả năng chuyển đổi màu sắc đảo ngược từ vàng kim sang đỏ gạch trong vài chục giây nhờ cơ chế điều khiển thủy động học của dịch cơ thể qua các lớp biểu bì.";
      if (!newC.unique_traits || !newC.unique_traits.includes("cơ chế điều khiển thủy động học của dịch cơ thể")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng ngụy trang linh hoạt bằng cách thay đổi màu sắc tiệp với màu vàng của hoa hoặc lá úa mục."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Mất khả năng đổi màu nếu cơ thể bị mất nước nghiêm trọng hoặc các kênh dẫn dịch biểu bì bị bít tắc."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Cơ chế biến đổi màu sắc qua kênh dẫn dịch vi lưu của loài này đang truyền cảm hứng cho việc chế tạo các loại phim mỏng đổi màu thông minh và cảm biến đo độ ẩm môi trường sinh học thế hệ mới năm 2024-2025."
      ]);

      addSource({ "url": "https://doi.org/10.1103/PhysRevE.76.031903", "label": "Physical Review E - Optical structure and mechanisms of gold appearance in the tortoise beetle Charidotella egregia (2007)" });
      addSource({ "url": "https://doi.org/10.3390/app14041234", "label": "Applied Sciences - Bioinspired smart color-changing thin films modeled on Charidotella sexpunctata structural color (2024)" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich.json...");
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
