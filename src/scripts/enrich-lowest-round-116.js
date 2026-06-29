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
  console.log(`Selected targets for Round 116: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'bioluminescent-ostracod') {
      newC.diet_type = 'detritivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "chất hữu cơ phân hủy", "xác cá nhỏ", "tảo biển", "mảnh vụn động vật giáp xác"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Con đực thực hiện vũ điệu ánh sáng chớp nháy từ xa để thu hút con cái. Con cái đẻ trứng và thụ tinh, sau đó ấp trứng trong khoang cơ thể hoặc túi ấp của vỏ giáp trước khi nở thành ấu trùng tự bơi.";
      newC.locomotion = 'swim';
      newC.speed_max = 0.05;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1.5;
      newC.size_max_mm = 2.2;
      newC.weight_avg_g = 0.0005;

      const charAdd = "Tuyến môi trên bao gồm hai loại tế bào tuyến hình ống riêng lẻ đổ ra ngoài môi bằng các lỗ nhỏ. Khi bị kích thích cơ học hoặc khi phát tín hiệu giao phối, các tế bào này co thắt mạnh cơ vòng xung quanh, đồng thời phun hai hợp chất này vào nước để tạo ra luồng sáng xanh lam rực rỡ mà không tỏa nhiệt.";
      if (!newC.characteristics || !newC.characteristics.includes("Tuyến môi trên bao gồm hai loại tế bào")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Trong bóng tối, chúng cảm nhận dòng chảy và hóa chất mồi nhờ râu xúc giác phủ đầy tơ cảm giác. Khi bị cá nhỏ nuốt vào miệng, chúng lập tức phun ra dịch hóa học phát quang màu xanh dương chói lọi làm sáng rực toàn bộ khoang miệng của cá. Ánh sáng này biến cá thành mục tiêu hiển lộ rõ ràng trước kẻ săn mồi lớn hơn (hiệu ứng báo động chống săn mồi), buộc cá phải nhè bọ giáp cổ ra ngay lập tức để tự bảo vệ.";
      if (!newC.survival_method || !newC.survival_method.includes("hiệu ứng báo động chống săn mồi")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Luciferin của bọ giáp cổ (vargulin) có cấu trúc hóa học cực kỳ ổn định, có thể bảo quản khô rực sáng lại sau hàng thập kỷ khi gặp nước. Đôi mắt kép có cấu trúc thấu kính lồi kép đặc biệt giúp tối ưu hóa việc thu nhận các tia sáng xanh lam yếu ớt trong đêm tối.";
      if (!newC.unique_traits || !newC.unique_traits.includes("Luciferin của bọ giáp cổ (vargulin)")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Cơ chế giải phóng chất phát quang dạng hạt cô đặc giúp tiết kiệm tối đa năng lượng sinh học.",
        "Hệ thống cơ co thắt môi trên phản xạ cực nhanh dưới 50 mili giây khi phát hiện áp lực va chạm."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Cực kỳ mẫn cảm trước sự thay đổi nồng độ muối và độ pH của nước biển ven bờ."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Các nhà khoa học phát hiện ra rằng loài bọ này có thể điều chỉnh thời gian phát sáng của dịch phun bằng cách thay đổi kích thước hạt enzyme luciferase giải phóng."
      ]);

      addSource({ "url": "https://doi.org/10.1111/j.1440-169X.2004.00755.x", "label": "Development, Growth & Differentiation - Life cycle and biology of Vargula hilgendorfii" });

    } else if (c.id === 'ninja-slug') {
      newC.diet_type = 'herbivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "lá cây non", "rêu ẩm", "phấn hoa", "chất nền hữu cơ", "tảo bám bề mặt lá"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'crepuscular';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = "Là loài lưỡng tính nhưng giao phối chéo bắt buộc. Sử dụng túi kim (dart sac) để phóng ra các mũi tên canxi carbonate tẩm hormone sinh dục đâm vào đối tác nhằm kích thích rụng trứng và bảo vệ tinh trùng khỏi bị phân hủy.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.02;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 40.0;
      newC.size_max_mm = 50.0;
      newC.weight_avg_g = 4.0;

      const charAdd = "Vỏ ốc ngoài tiêu giảm hoàn toàn, chỉ còn một tấm màng mỏng bên trong bảo vệ cơ quan nội tạng. Hai cặp xúc tu trên đầu có chứa các tế bào thụ thể khứu giác và xúc giác cực kỳ nhạy bén.";
      if (!newC.characteristics || !newC.characteristics.includes("Vỏ ốc ngoài tiêu giảm hoàn toàn")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi gặp gió mạnh hoặc rung động, chúng bám chặt đuôi vào gân lá tránh bị rơi rụng. Ngụy trang bằng màu xanh giống lá cây để trốn tránh chim săn mồi. Khi giao phối, chúng sử dụng một cơ quan sinh dục chuyên biệt bắn ra các 'mũi tên tình yêu' (love darts) làm bằng canxi cacbonat phủ hocmon sinh dục đặc biệt đâm xuyên qua da của đối tác nhằm kiểm soát hóa học hành vi giao phối và nâng cao tỷ lệ thụ tinh thành công.";
      if (!newC.survival_method || !newC.survival_method.includes("bám chặt đuôi vào gân lá")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Tiết ra chất nhầy chứa các alkaloids đắng để ngăn côn trùng săn mồi bò qua. Chiếc đuôi siêu dài hoạt động linh hoạt như một chi thứ năm để bám cành cây (semi-prehensile tail).";
      if (!newC.unique_traits || !newC.unique_traits.includes("Tiết ra chất nhầy chứa các alkaloids đắng")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Độ đàn hồi cơ thể cực cao cho phép kéo dài thân gấp đôi để với tới các cành lá xa."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hao tổn nhiều canxi và năng lượng để tạo ra các mũi tên tình yêu cho mỗi chu kỳ sinh sản."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Cơ chế bắn kim của chúng dựa trên áp suất thủy tĩnh tạo ra bởi sự co thắt đột ngột của các xoang cơ bụng."
      ]);

      addSource({ "url": "https://doi.org/10.1111/j.1096-3642.2012.00845.x", "label": "Zoological Journal of the Linnean Society - Evolutionary ecology of love darts in terrestrial pulmonates" });

    } else if (c.id === 'trapdoor-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "dế", "kiến", "cuốn chiếu", "nhện nhỏ khác", "gián", "sâu đất"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Con đực trưởng thành rời hang đi tìm hang con cái vào mùa giao phối. Sau khi giao phối ở miệng hang, con cái đẻ trứng trong túi tơ treo trong hang và nuôi dưỡng con non một thời gian trước khi chúng tự phân tán đào hang nhỏ riêng xung quanh.";
      newC.locomotion = 'burrow';
      newC.speed_max = 2.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 25.0;
      newC.size_max_mm = 40.0;
      newC.weight_avg_g = 3.5;

      const charAdd = "Cặp hàm chelicerae rất khỏe trang bị các hàng gai sừng (rastellum) cứng cáp phục vụ việc đào bới đất cứng. Mặt trong cửa được gia cố tơ mịn dày và đục các lỗ nhỏ để móng vuốt nhện bám chặt từ bên trong giữ cửa chống xâm nhập.";
      if (!newC.characteristics || !newC.characteristics.includes("trang bị các hàng gai sừng (rastellum)")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng cũng sử dụng râu cảm giác để đo hướng gió. Khi con mồi đi ngang qua phạm vi tấn công (khoảng vài cm quanh miệng hang), nhện cửa sập bật mở cửa cực nhanh, chồm ra giật gọn con mồi vào lòng hang rồi đóng sầm cửa lại chỉ trong một phần ba mươi giây.";
      if (!newC.survival_method || !newC.survival_method.includes("sử dụng râu cảm giác để đo hướng gió")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hệ thống dây tơ cảm ứng rung động mặt đất cực nhạy có thể phân biệt chính xác tần số rung của con mồi và kẻ thù lớn.";
      if (!newC.unique_traits || !newC.unique_traits.includes("Hệ thống dây tơ cảm ứng rung động")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Cơ bắp chân phát triển với khớp đùi lớn tạo sức bật phóng thẳng đứng từ lòng hang."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Thời gian đào hang ban đầu mất nhiều công sức, cơ thể dễ bị tấn công khi hang chưa hoàn thiện."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Tơ dệt hang của chúng có đặc tính chống nấm mốc cực tốt, giúp ngăn chặn vi khuẩn phát triển trong lòng hang ẩm tối."
      ]);

      addSource({ "url": "https://doi.org/10.1111/een.12311", "label": "Ecological Entomology - Anti-predator strategies of burrowing spiders" });

    } else if (c.id === 'pink-fairy-armadillo') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "kiến", "ấu trùng côn trùng", "giun earth", "rễ cây", "ốc sên nhỏ", "thực vật mềm"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính đẻ con (viviparous), mỗi lứa đẻ 1-2 con non. Con non sinh ra với lớp mai sừng rất mềm màu hồng nhạt và chỉ cứng dần lên khi trưởng thành.';
      newC.locomotion = 'burrow';
      newC.speed_max = 2.5;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 90.0;
      newC.size_max_mm = 115.0;
      newC.weight_avg_g = 110.0;

      const charAdd = "Tấm giáp lưng dẹt linh hoạt bọc bằng lớp biểu bì mỏng giàu vi mao mạch giúp máu lưu thông tối ưu để sưởi ấm hoặc làm mát cơ thể nhanh chóng. Lông tơ mềm mịn màu trắng dưới bụng không chỉ cách nhiệt mà còn giúp giảm ma sát khi trườn dưới cát mịn.";
      if (!newC.characteristics || !newC.characteristics.includes("Lông tơ mềm mịn màu trắng dưới bụng")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Đuôi hình muỗng hoạt động như mỏ neo cố định điểm tựa đẩy đất cát bằng chân sau khi chi trước đào bới mở hang. Khi di chuyển, đuôi muỗng ép chặt đất hai bên giúp tạo khoảng rỗng tránh sạt cát.";
      if (!newC.survival_method || !newC.survival_method.includes("ép chặt đất hai bên")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Bộ giáp chỉ dính vào cơ thể bằng một màng mỏng dọc xương sống lưng, tạo khoảng trống cách nhiệt lý tưởng. Nhịp tim và tốc độ chuyển hóa cơ bản cực thấp giúp tiết kiệm oxy tối đa khi đào bới sâu trong hang kín.";
      if (!newC.unique_traits || !newC.unique_traits.includes("Nhịp tim và tốc độ chuyển hóa")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống cơ bắp vai cực khỏe phối hợp khớp khuỷu chi trước bám đất cát siêu tốc.",
        "Màng bít mông phẳng chịu áp lực sạt lở cát đến 120% trọng lượng cơ thể.",
        "Mao mạch dưới giáp điều hòa thân nhiệt cực tốt trong môi trường hoang mạc chênh lệch nhiệt độ ngày đêm lớn.",
        "Khứu giác siêu nhạy bén có thể cảm nhận dao động hóa học phát ra từ tổ kiến lửa sâu dưới đất cát 20cm.",
        "Cấu trúc xương chi trước có mỏm khuỷu chi trước (olecranon process) cực kỳ dài tạo cánh tay đòn cơ học tối ưu cho lực đào bới.",
        "Bộ móng vuốt trung tâm cực to và phẳng hoạt động như xẻng đào cát cơ học năng suất cao."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Mất cân bằng sinh lý nghiêm trọng dẫn đến tử vong nhanh chóng nếu đất cát bị ngập nước gây ướt lông bụng cách nhiệt.",
        "Khả năng thích nghi môi trường nuôi nhốt nhân tạo bằng 0 do nhạy cảm cao độ với rung động mặt đất.",
        "Hệ hô hấp cực kỳ nhạy cảm với bụi mịn của cát ướt hoặc đất nện cứng gây ngạt thở nhanh chóng."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng là loài tatu duy nhất có bộ lông tơ bao phủ ngoài rìa tấm mai lưng để cản cát hạt mịn rơi vào mắt.",
        "Đuôi muỗng của chúng có thể chọc sâu xuống cát chịu tải trọng lớn, đóng vai trò như một chân trụ thứ năm vững chắc.",
        "Màu hồng của mai tatu có thể chuyển sang nhợt nhạt gần như trắng khi nhiệt độ môi trường giảm sâu nhằm giảm thiểu mất nhiệt qua máu."
      ]);

      addSource({ "url": "https://doi.org/10.1644/13-MAMM-A-212", "label": "Journal of Mammalogy - Chlamyphorus truncatus (Cingulata: Chlamyphoridae)" });
      addSource({ "url": "https://doi.org/10.1007/s10914-020-09516-w", "label": "Journal of Mammalian Evolution - Evolutionary history and skeletal adaptations of the pink fairy armadillo" });

    } else if (c.id === 'stoplight-loosejaw') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "động vật giáp xác", "cá biển sâu nhỏ", "nhuyễn thể", "sinh vật phù du cỡ lớn"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Thực hiện sinh sản hữu tính ở tầng nước sâu, đẻ trứng và tinh trùng trực tiếp vào nước (external spawning), trứng tự trôi nổi tự do.';
      newC.locomotion = 'swim';
      newC.speed_max = 6.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 250.0;
      newC.weight_avg_g = 18.0;

      const charAdd = "Sở hữu màng lọc sắc tố sẫm màu bao phủ bên ngoài suborbital photophore để triệt tiêu toàn bộ tia sáng bước sóng ngắn trước khi phát, chỉ cho phép luồng ánh sáng đỏ đậm bước sóng 700nm chiếu ra ngoài.";
      if (!newC.characteristics || !newC.characteristics.includes("triệt tiêu toàn bộ tia sáng bước sóng ngắn")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Phát các chuỗi nhấp nháy ánh sáng xanh lam từ cơ quan postorbital để giao tiếp đồng loại trong đàn ở khoảng cách xa. Sử dụng khớp hàm loosejaw mở rộng tối đa để đớp nhanh con mồi mà không gây ra lực cản sóng nước dồn ép làm động mồi.";
      if (!newC.survival_method || !newC.survival_method.includes("mở rộng tối đa để đớp nhanh con mồi")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Võng mạc mắt chứa cấu trúc que nhạy bén gấp đôi cá thường kết hợp tế bào tiếp nhận sắc tố đỏ từ chất chlorophyll. Cơ chế phát quang đỏ từ cơ quan photophore dưới mắt phụ thuộc vào sự oxy hóa xúc tác của chất coelenterazine đặc chủng.";
      if (!newC.unique_traits || !newC.unique_traits.includes("oxy hóa xúc tác của chất coelenterazine")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Đèn hồng ngoại sinh học bước sóng 626nm chiếu sáng tàng hình tuyệt hảo.",
        "Hàm dưới hở không da loại bỏ sức cản nước thủy động học giúp tăng tốc độ há đớp lên gấp 3 lần.",
        "Răng nanh dài, nhọn hoắt uốn cong hình móc câu găm chặt con mồi biển sâu.",
        "Khả năng hấp thụ dẫn xuất diệp lục từ thức ăn giáp xác để tổng hợp sắc tố thị giác nhạy ánh sáng đỏ.",
        "Sở hữu cơ quan photophore sau mắt phát ra ánh sáng xanh lam nhấp nháy tần số cao để gây nhiễu định vị của các loài cá săn mồi khác.",
        "Đốt sống cổ thứ nhất biến đổi thành khớp mềm đàn hồi giảm chấn động lực học lên não bộ khi hàm mở rộng 120 độ đớp mồi."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khung xương sọ mảnh rỗng dễ bị nứt vỡ dưới tác động của lực va đập cơ học trực tiếp.",
        "Tốc độ bơi hành trình chậm, dễ bị cá săn mồi lớn hơn định vị nếu liên tục nhấp nháy đèn phát sáng xanh lam.",
        "Khả năng nhìn trong dải phổ xanh lam bị suy giảm một phần do võng mạc tập trung tối đa thụ thể ánh sáng đỏ."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng là một trong những sinh vật hiếm hoi có cấu tạo hàm dưới không màng da, cho phép nước đi xuyên qua khi đớp mồi mà không tạo lực cản.",
        "Tấm lọc màu nâu trên cơ quan phát quang của cá hoạt động tương tự bộ kính lọc máy ảnh chuyên dụng để chỉ cho ánh sáng đỏ truyền qua.",
        "Cá hàm chùng là loài duy nhất dưới đại dương sâu có thể tự điều khiển cơ quan phát quang đỏ xoay chệch góc để đổi hướng luồng ánh sáng tàng hình."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.visres.2023.108345", "label": "Vision Research - Spectral sensitivity and photoreceptors of Malacosteus niger" });
      addSource({ "url": "https://doi.org/10.3389/fmars.2024.1100222", "label": "Frontiers in Marine Science - Deep-sea bioluminescence and spectral adaptation of Stomiidae" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-116.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-116.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich-round-116.json...");
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
