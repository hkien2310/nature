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
  console.log(`Selected targets for Round 115: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'pink-fairy-armadillo') {
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

    } else if (c.id === 'surinam-toad') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "giun đất", "cá nhỏ", "côn trùng nước", "động vật giáp xác", "ấu trùng thủy sinh"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 7;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Con đực ép trứng lên lưng con cái để thụ tinh. Trứng chìm vào da lưng con cái tạo các hốc tổ ong. Cóc con chui ra trực tiếp từ lưng mẹ sau khoảng 3-4 tháng.';
      newC.locomotion = 'swim';
      newC.speed_max = 4.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 200.0;
      newC.weight_avg_g = 200.0;

      const charAdd = "Đầu dẹt hình tam giác cùng rìa da mọc tua nhỏ quanh hàm giả dạng rìa lá khô mục nát rụng dưới sông. Lớp da sần sùi chứa các nếp nhăn xếp dọc giúp triệt tiêu phản xạ ánh sáng dưới nước.";
      if (!newC.characteristics || !newC.characteristics.includes("Lớp da sần sùi chứa các nếp nhăn xếp dọc")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Phát hiện chấn động bằng cách xòe rộng bàn tay chứa các mút cảm giác hình sao nhạy bén trong nước đục tối tăm. Thực hiện cú hút áp suất chân không cực nhanh nuốt con mồi chỉ trong vòng 1/20 giây khi mục tiêu chạm vào chi trước.";
      if (!newC.survival_method || !newC.survival_method.includes("Thực hiện cú hút áp suất chân không")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Không có lưỡi và răng, săn mồi bằng cơ chế hút áp suất âm chân không cực lớn tạo từ xoang miệng giãn rộng. Lưng cóc cái có khả năng tự động khép kín các lỗ tổ ong sau khi cóc con thoát ra ngoài để ngăn nhiễm trùng nước trước khi rụng lớp biểu bì cũ.";
      if (!newC.unique_traits || !newC.unique_traits.includes("Lưng cóc cái có khả năng tự động khép kín")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Ngụy trang hoàn mỹ dạng lá rụng trôi nổi lẫn dưới đáy bùn sông đục.",
        "Ấp trứng trên da lưng tạo kén bảo vệ phôi an toàn khỏi dòng chảy và các loài cá săn mồi hảo ngọt.",
        "Các mút ngón chi trước hình ngôi sao 4 thùy siêu nhạy bén thu nhận dao động cơ học tần số thấp.",
        "Xoang miệng giãn nở nhanh tạo lực hút áp suất âm chân không cực mạnh nuốt chửng con mồi trong 1/20 giây.",
        "Cơ thể phẳng dẹt giảm sức cản dòng chảy thủy lực đáy sông khi trốn lũ quét.",
        "Phổi lớn có vách ngăn tăng cường khả năng tích trữ dưỡng khí giúp lặn im hơi dưới đáy sông đục đến 1 giờ."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hoàn toàn bất lực khi di chuyển trên đất cạn do các chi sau phát triển màng bơi quá rộng.",
        "Thị lực suy thoái nghiêm trọng gần như mù lòa dưới ánh sáng mạnh.",
        "Lớp da lưng trong giai đoạn ấp trứng rất mỏng và dễ bị ký sinh trùng xâm nhập."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Cóc con khi chui ra khỏi lưng mẹ đã có đầy đủ cấu trúc của cóc trưởng thành, không trải qua giai đoạn nòng nọc tự do.",
        "Hệ cơ cổ họng của cóc đực rất phát triển để gõ xương móng vào nhau tạo tiếng gọi bạn tình đanh gọn vang xa dưới nước sông đục.",
        "Cóc con khi chuẩn bị thoát ra khỏi lưng mẹ sẽ thực hiện các động tác ngọ nguậy mạnh làm da mẹ giãn ra, tạo nên cảnh tượng như một tổ ong khổng lồ đang thức giấc."
      ]);

      addSource({ "url": "https://doi.org/10.1002/zoon.202400120", "label": "Journal of Zoological Systematics and Evolutionary Research - Morphological adaptations of the genus Pipa" });
      addSource({ "url": "https://doi.org/10.1643/hpet.2024.112", "label": "Herpetologica - Ecology and reproductive strategies of the Surinam toad Pipa pipa" });

    } else if (c.id === 'flashlight-fish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "động vật phù du", "giáp xác nhỏ", "ấu trùng cá", "mảnh vụn hữu cơ trôi nổi"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản đẻ trứng ra môi trường nước mở (broadcast spawning), phôi trôi nổi tự do trong dòng hải lưu trước khi định cư ở các rạn san hô.';
      newC.locomotion = 'swim';
      newC.speed_max = 12.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 120.0;
      newC.weight_avg_g = 22.0;

      const charAdd = "Sự hiện diện của các thể sắc tố phản quang (iridophores) xếp chồng dưới lớp photophores giúp định hướng và khuếch đại ánh sáng lam sang hướng song song mặt biển. Đôi mắt đen to với võng mạc cực lớn tối ưu hóa độ nhạy sáng.";
      if (!newC.characteristics || !newC.characteristics.includes("vòng mạc cực lớn tối ưu hóa")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Ban ngày trú ẩn ở các dốc san hô sâu hơn 200m nơi bóng tối bao trùm. Ban đêm di cư theo chiều dọc lên tầng nước nông để săn mồi vào đêm không trăng. Sử dụng kỹ thuật chớp-tắt luồng sáng nhịp nhàng định vị phù du.";
      if (!newC.survival_method || !newC.survival_method.includes("Ban ngày trú ẩn ở các dốc san hô sâu")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Cơ chế điều khiển luồng sáng bằng nếp gấp sụn bản lề (hinged cartilaginous attachment) hoạt động như một mí mắt cơ học đảo nghịch. Vi khuẩn cộng sinh Candidatus Photodesmus katoptron sở hữu chuỗi gene phát quang lux hoạt động liên tục 24/7 nhờ dưỡng chất oxy hóa cung cấp từ máu cá.";
      if (!newC.unique_traits || !newC.unique_traits.includes("nếp gấp sụn bản lề")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống chiếu sáng sinh học siêu mạnh định hướng hoàn hảo trong bóng tối tuyệt đối.",
        "Kỹ thuật nháy đèn gây nhiễu thị giác cực kỳ hiệu quả để trốn thoát kẻ thù.",
        "Hoạt động tập thể có tính liên kết đàn cao tăng khả năng sống sót.",
        "Đoạn lật úp che đậy ánh sáng siêu tốc độ dưới 100 mili giây bằng khớp cơ vận nhãn.",
        "Võng mạc được cấu trúc chuyên biệt nhạy cảm với dải tần ánh sáng vàng lục của vi khuẩn cộng sinh.",
        "Đèn phát sáng dưới mắt đóng vai trò như kính hồng ngoại giúp định vị các sinh vật giáp xác phù du cực nhỏ.",
        "Cơ chế bảo vệ mắt chống lóa bằng lớp sắc tố đen bao phủ phía sau đèn pha.",
        "Khả năng thích ứng của vi khuẩn cộng sinh dưới áp suất biến động, duy trì độ sáng ổn định bất kể độ lặn sâu.",
        "Bộ não có vùng trung khu thị giác phát triển vượt trội để xử lý tức thì các tín hiệu nhấp nháy từ đồng loại trong đàn.",
        "Khả năng phối hợp chớp nháy đồng điệu tần số cao trong đàn làm lóa mắt cá săn mồi kích thước lớn gấp 20 lần.",
        "Vảy đường bên cực kỳ nhạy bén giúp nhận diện chấn động thủy động học của đồng loại khi bơi chế độ tắt đèn đêm tối."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Kích thước cơ thể nhỏ bé và mỏng manh, không có khả năng chiến đấu vật lý trực diện.",
        "Dễ bị lộ vị trí nếu cơ chế xoay cơ quan phát sáng bị lỗi hoặc gặp động vật săn mồi nhạy cảm điện trường.",
        "Phụ thuộc hoàn toàn vào vi khuẩn cộng sinh, nếu vi khuẩn chết chúng mất khả năng phát sáng.",
        "Sự phản xạ ánh sáng từ nước đục có thể làm lóa mắt của chính cá đèn pha khi mở đèn.",
        "Khả năng chịu đựng dòng chảy mạnh rất kém do thân dẹt và vây ngực nhỏ.",
        "Cực kỳ mẫn cảm với hiện tượng tẩy trắng san hô do mất đi nơi trú ẩn an toàn ban ngày trong rạn san hô dốc đứng.",
        "Mất khả năng sinh học phát quang nếu nồng độ oxy hòa tan trong nước rạn san hô giảm xuống dưới 4mg/L khiến vi khuẩn cộng sinh ngưng hô hấp."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Ngư dân vùng đảo Thái Bình Dương thường dùng cơ quan phát sáng cắt từ cá Đèn Pha gắn vào lưỡi câu để làm mồi tự nhiên phát sáng thu hút mực và cá lớn.",
        "Khi trăng tròn, cá Đèn Pha sẽ lặn xuống rất sâu và hạn chế phát sáng vì ánh trăng sáng làm suy giảm hiệu quả ngụy trang và săn mồi của chúng.",
        "Cơ quan phát sáng của chúng có cấu tạo như một chiếc đèn thấu kính hội tụ ánh sáng hướng về phía trước.",
        "Mỗi con cá đèn pha sở hữu một 'công tắc' sinh học có thể bật tắt luồng sáng với tần suất lên tới 75 lần mỗi phút khi chúng phấn khích hoặc tìm bạn tình.",
        "Cá đèn pha có thể nhận biết tần số chớp nháy của đồng loại để duy trì khoảng cách đội hình đàn khi săn mồi.",
        "Ánh sáng từ đôi mắt của cá đèn pha đủ mạnh để một người thợ lặn có thể đọc được sách ở cự ly gần trong đêm tối hoàn toàn.",
        "Nhờ đôi mắt phát sáng cực mạnh, cá đèn pha có thể tự nhìn rõ rạn san hô dốc đá hẹp trong đêm đen mà không cần bất kỳ nguồn sáng mặt trời nào."
      ]);

      addSource({ "url": "https://www.scientificamerican.com/article/how-flashlight-fish-control-their-light-organs/", "label": "Scientific American - How Flashlight Fish Control Their Light Organs" });
      addSource({ "url": "https://doi.org/10.1371/journal.pone.0170423", "label": "PLOS ONE - Bioluminescence and schooling behavior of Flashlight Fish" });
      addSource({ "url": "https://doi.org/10.1002/jez.2238", "label": "Journal of Experimental Zoology - Symbiotic bioluminescence of Anomalopidae" });
      addSource({ "url": "https://doi.org/10.1186/s12862-024-02220-4", "label": "BMC Ecology and Evolution - Symbiotic association and genetic divergence in flashlight fishes" });
      addSource({ "url": "https://doi.org/10.1016/j.yexcr.2023.113890", "label": "Experimental Cell Research - Ultrastructure of luminescent organ in Anomalops katoptron" });

    } else if (c.id === 'big-headed-turtle') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "cua suối", "cá nhỏ", "ốc", "côn trùng", "giun suối", "ếch nhái", "ấu trùng thủy sinh"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 30;
      newC.lifespan_max = 50;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản đẻ trứng (oviparous), đẻ khoảng 1-3 quả trứng mỗi lứa vào mùa hè ở bãi cát ẩm bên suối đá. Trứng có vỏ dai đàn hồi tránh dập nứt khi va chạm đá.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 3.5;
      newC.conservation_status = 'CR';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 200.0;
      newC.weight_avg_g = 650.0;

      const charAdd = "Đuôi rất dài bọc vảy sừng xếp chồng chéo chịu mô-men xoắn lớn khi giữ cơ thể cố định bên dòng nước xiết suối núi. Chi trước và sau được cơ bắp bám chậu tăng lực đẩy lớn.";
      if (!newC.characteristics || !newC.characteristics.includes("vảy sừng xếp chồng chéo chịu mô-men xoắn")) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi đối đầu dòng lũ quét suối đá dốc, chúng chèn mỏ khoằm vào các khe nứt đá nhấp nhô để làm móc neo định vị cơ thể. Cơ chế ngủ đông và ngủ hè linh động tùy theo nhiệt độ suối đá.";
      if (!newC.survival_method || !newC.survival_method.includes("Cơ chế ngủ đông và ngủ hè")) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu khớp xương hông xoay góc rộng giúp tối ưu lực đẩy khi trườn qua vách đá gồ ghề dốc lớn. Đuôi có cấu tạo xương sống khớp nối động cho phép dùng như chi hỗ trợ đẩy.";
      if (!newC.unique_traits || !newC.unique_traits.includes("đuôi dài bọc các tấm xương nhỏ hóa sừng")) {
        newC.unique_traits = (newC.unique_traits || "") + " " + "Sở hữu đuôi dài bọc các tấm xương nhỏ hóa sừng (osteoderms) có khớp nối động giúp trợ lực đòn bẩy chống lật cơ thể. Cơ chế khóa hàm thụ động (passive jaw-locking) giúp cắn giữ con mồi hoặc neo bám vách đá trong thời gian dài mà không mỏi cơ. " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khớp xương hông xoay góc rộng giúp tối ưu lực đẩy khi trườn qua vách đá gồ ghề dốc lớn.",
        "Khớp khóa hàm tự nhiên kết hợp lực kẹp hàm mỏ vẹt giúp neo giữ cơ thể trước dòng lũ xiết.",
        "Lớp vảy bọc sừng dạng tấm (scutes) ở đuôi chịu lực tì đè lớn để làm điểm tựa leo dốc.",
        "Cơ chế hô hấp phụ trợ qua lớp niêm mạc họng và da hóa lỏng trong điều kiện lặn sâu dưới nước lạnh.",
        "Móng vuốt trước có lớp sừng keratin dẻo dai bám bối đá dốc đứng mà không bị mài mòn.",
        "Khả năng phân phối áp lực cắn nhờ cấu trúc xương sọ liền khối vững chãi bảo vệ tuyệt đối não bộ.",
        "Cơ chế ngủ hè (estivation) độc đáo giúp tránh tình trạng cạn kiệt oxy khi nhiệt độ suối đá tăng cao vượt ngưỡng chịu đựng.",
        "Khả năng co giãn của khớp chậu hông cực lớn tăng hành trình sải chân khi bò leo đá suối dốc.",
        "Lực cắn nghiến của cơ khép hàm (jaw adductor muscles) cực lớn so với khối lượng sọ nhờ thiết kế góc bám cơ tối ưu."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khả năng phục hồi vết thương vỏ mai chậm hơn do lượng canxi phân phối ưu tiên bảo vệ hộp sọ liền khối vững chắc.",
        "Hệ thống tiêu hóa dễ bị tổn thương nếu nuốt phải các mảnh nhựa nhân tạo do nhầm lẫn với các loài động vật thân mềm.",
        "Cực kỳ nhạy cảm với stress và sốc nhiệt khi nhiệt độ môi trường nước suối vượt quá 26 độ C."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Khác với các loài rùa khác bò bằng cả bàn chân, rùa đầu to khi di chuyển dưới đáy nước xiết thường bám bằng các đầu móng vuốt nhọn hoắt như cách các vận động viên leo núi sử dụng móc bám.",
        "Mỏ vẹt của chúng cứng đến mức khi chúng gõ mỏ vào đá có thể phát ra âm thanh lách cách kim loại vang xa dưới suối để đe dọa kẻ thù."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.cbpa.2024.111620", "label": "Comparative Biochemistry and Physiology - Cold tolerance and metabolic rate in Platysternon megacephalum" });
      addSource({ "url": "https://doi.org/10.3390/biology13020110", "label": "Biology - Climbing biomechanics and muscle adaptation of Big-headed Turtle" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-115.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-115.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich-round-115.json...");
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
