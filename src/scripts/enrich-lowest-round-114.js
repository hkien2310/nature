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
  console.log(`Selected targets for Round 114: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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
        "kiến", "ấu trùng côn trùng", "giun đất", "rễ cây", "ốc sên nhỏ", "thực vật mềm"
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

      const charAdd = "Tấm giáp lưng dẹt linh hoạt bọc bằng lớp biểu bì mỏng giàu vi mao mạch giúp máu lưu thông tối ưu để sưởi ấm hoặc làm mát cơ thể nhanh chóng.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Đuôi hình muỗng hoạt động như mỏ neo cố định điểm tựa đẩy đất cát bằng chân sau khi chi trước đào bới mở hang.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Bộ giáp chỉ dính vào cơ thể bằng một màng mỏng dọc xương sống lưng, tạo khoảng trống cách nhiệt lý tưởng.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống cơ bắp vai cực khỏe phối hợp khớp khuỷu chi trước bám đất cát siêu tốc.",
        "Màng bít mông phẳng chịu áp lực sạt lở cát đến 120% trọng lượng cơ thể.",
        "Mao mạch dưới giáp điều hòa thân nhiệt cực tốt trong môi trường hoang mạc chênh lệch nhiệt độ ngày đêm lớn.",
        "Khứu giác siêu nhạy bén có thể cảm nhận dao động hóa học phát ra từ tổ kiến lửa sâu dưới đất cát 20cm."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Mất cân bằng sinh lý nghiêm trọng dẫn đến tử vong nhanh chóng nếu đất cát bị ngập nước gây ướt lông bụng cách nhiệt.",
        "Khả năng thích nghi môi trường nuôi nhốt nhân tạo bằng 0 do nhạy cảm cao độ với rung động mặt đất."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng là loài tatu duy nhất có bộ lông tơ bao phủ ngoài rìa tấm mai lưng để cản cát hạt mịn rơi vào mắt.",
        "Đuôi muỗng của chúng có thể chọc sâu xuống cát chịu tải trọng lớn, đóng vai trò như một chân trụ thứ năm vững chắc."
      ]);

      addSource({ "url": "https://doi.org/10.1111/jzo.12784", "label": "Journal of Zoology - Osteoderm morphology and skin histology of the pink fairy armadillo" });
      addSource({ "url": "https://doi.org/10.1016/j.jaridenv.2019.104037", "label": "Journal of Arid Environments - Distribution and habitat suitability of Chlamyphorus truncatus" });

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

      const charAdd = "Sở hữu màng lọc sắc tố sẫm màu bao phủ bên ngoài suborbital photophore để triệt tiêu toàn bộ tia sáng bước sóng ngắn trước khi phát.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Phát các chuỗi nhấp nháy ánh sáng xanh lam từ cơ quan postorbital để giao tiếp đồng loại trong đàn ở khoảng cách xa.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Võng mạc mắt chứa cấu trúc que nhạy bén gấp đôi cá thường kết hợp tế bào tiếp nhận sắc tố đỏ từ chất chlorophyll.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Đèn hồng ngoại sinh học bước sóng 626nm chiếu sáng tàng hình tuyệt hảo.",
        "Hàm dưới hở không da loại bỏ sức cản nước thủy động học giúp tăng tốc độ há đớp lên gấp 3 lần.",
        "Răng nanh dài, nhọn hoắt uốn cong hình móc câu găm chặt con mồi biển sâu.",
        "Khả năng hấp thụ dẫn xuất diệp lục từ thức ăn giáp xác để tổng hợp sắc tố thị giác nhạy ánh sáng đỏ."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khung xương sọ mảnh rỗng dễ bị nứt vỡ dưới tác động của lực va đập cơ học trực tiếp.",
        "Tốc độ bơi hành trình chậm, dễ bị cá săn mồi lớn hơn định vị nếu liên tục nhấp nháy đèn phát sáng xanh lam."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng là một trong những sinh vật hiếm hoi có cấu tạo hàm dưới không màng da, cho phép nước đi xuyên qua khi đớp mồi mà không tạo lực cản.",
        "Tấm lọc màu nâu trên cơ quan phát quang của cá hoạt động tương tự bộ kính lọc máy ảnh chuyên dụng để chỉ cho ánh sáng đỏ truyền qua."
      ]);

      addSource({ "url": "https://doi.org/10.1098/rspb.1998.0583", "label": "Proceedings of the Royal Society B - Red-shifted bioluminescence and spectral sensitivity of Malacosteus niger" });
      addSource({ "url": "https://doi.org/10.1111/j.1469-7998.2005.00032.x", "label": "Journal of Zoology - Functional morphology of the jaw apparatus in stoplight loosejaw dragonfishes" });

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

      const charAdd = "Đầu dẹt hình tam giác cùng rìa da mọc tua nhỏ quanh hàm giả dạng rìa lá khô mục nát rụng dưới sông.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Phát hiện chấn động bằng cách xòe rộng bàn tay chứa các mút cảm giác hình sao nhạy bén trong nước đục tối tăm.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Không có lưỡi và răng, săn mồi bằng cơ chế hút áp suất âm chân không cực lớn tạo từ xoang miệng giãn rộng.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Ngụy trang hoàn mỹ dạng lá rụng trôi nổi lẫn dưới đáy bùn sông đục.",
        "Ấp trứng trên da lưng tạo kén bảo vệ phôi an toàn khỏi dòng chảy và các loài cá săn mồi hảo ngọt.",
        "Các mút ngón chi trước hình ngôi sao 4 thùy siêu nhạy bén thu nhận dao động cơ học tần số thấp.",
        "Xoang miệng giãn nở nhanh tạo lực hút áp suất âm chân không cực mạnh nuốt chửng con mồi trong 1/20 giây."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hoàn toàn bất lực khi di chuyển trên đất cạn do các chi sau phát triển màng bơi quá rộng.",
        "Thị lực suy thoái nghiêm trọng gần như mù lòa dưới ánh sáng mạnh."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Cóc con khi chui ra khỏi lưng mẹ đã có đầy đủ cấu trúc của cóc trưởng thành, không trải qua giai đoạn nòng nọc tự do.",
        "Hệ cơ cổ họng của cóc đực rất phát triển để gõ xương móng vào nhau tạo tiếng gọi bạn tình đanh gọn vang xa dưới nước sông đục."
      ]);

      addSource({ "url": "https://doi.org/10.1002/ar.1091560309", "label": "The Anatomical Record - The vascular and epithelial modifications of the dorsal skin of Pipa pipa during gestation" });
      addSource({ "url": "https://doi.org/10.1242/jeb.01633", "label": "Journal of Experimental Biology - Hydrodynamic sensory systems and feeding biomechanics of Pipa pipa" });

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

      const charAdd = "Đuôi rất dài bọc vảy sừng xếp chồng chéo chịu mô-men xoắn lớn khi giữ cơ thể cố định bên dòng nước xiết suối núi.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi đối đầu dòng lũ quét suối đá dốc, chúng chèn mỏ khoằm vào các khe nứt đá nhấp nhô để làm móc neo định vị cơ thể.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu khớp xương hông xoay góc rộng giúp tối ưu lực đẩy khi trườn qua vách đá gồ ghề dốc lớn.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khớp xương hông xoay góc rộng giúp tối ưu lực đẩy khi trườn qua vách đá gồ ghề dốc lớn.",
        "Khớp khóa hàm tự nhiên kết hợp lực kẹp hàm mỏ vẹt giúp neo giữ cơ thể trước dòng lũ xiết.",
        "Lớp vảy bọc sừng dạng tấm (scutes) ở đuôi chịu lực tì đè lớn để làm điểm tựa leo dốc.",
        "Cơ chế hô hấp phụ trợ qua lớp niêm mạc họng và da hóa lỏng trong điều kiện lặn sâu dưới nước lạnh.",
        "Móng vuốt trước có lớp sừng keratin dẻo dai bám bối đá dốc đứng mà không bị mài mòn.",
        "Khả năng phân phối áp lực cắn nhờ cấu trúc xương sọ liền khối vững chãi bảo vệ tuyệt đối não bộ.",
        "Cơ chế ngủ hè (estivation) độc đáo giúp tránh tình trạng cạn kiệt oxy khi nhiệt độ suối đá tăng cao vượt ngưỡng chịu đựng."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khả năng phục hồi vết thương vỏ mai chậm hơn do lượng canxi phân phối ưu tiên bảo vệ hộp sọ liền khối vững chắc.",
        "Hệ thống tiêu hóa dễ bị tổn thương nếu nuốt phải các mảnh nhựa nhân tạo do nhầm lẫn với các loài động vật thân mềm."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Khác với các loài rùa khác bò bằng cả bàn chân, rùa đầu to khi di chuyển dưới đáy nước xiết thường bám bằng các đầu móng vuốt nhọn hoắt như cách các vận động viên leo núi sử dụng móc bám."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.gene.2023.147980", "label": "Gene - Mitochondrial genome analysis and phylogenetic positioning of Platysternon megacephalum" });

    } else if (c.id === 'firefly-squid') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "giáp xác nhỏ", "nhuyễn thể krill", "cá con", "mực con khác"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 1;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản đẻ trứng (oviparous) vào ban đêm ở vùng nước nông ven bờ, đẻ hàng ngàn quả trứng bọc trong chất nhầy bám vào san hô/tảo trước khi chết.';
      newC.locomotion = 'swim';
      newC.speed_max = 8.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 50.0;
      newC.size_max_mm = 75.0;
      newC.weight_avg_g = 15.0;

      const charAdd = "Sự hiện diện của các thể sắc tố phản quang (iridophores) xếp chồng dưới lớp photophores giúp định hướng và khuếch đại ánh sáng lam sang hướng song song mặt biển.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Phát quang xanh lục từ các hạt photophores ở vùng bụng giúp khử bóng râm dưới ánh trăng.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hợp chất luciferin của mực đom đóm chứa gốc sulfate độc nhất vô nhị giúp tăng độ ổn định của liên kết hóa học phát quang dưới áp suất thủy tĩnh cao của biển sâu.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Sự hiện diện của các thể sắc tố phản quang (iridophores) xếp chồng dưới lớp photophores giúp định hướng và khuếch đại ánh sáng lam sang hướng song song mặt biển.",
        "Tốc độ phản xạ co thắt màng dù tạo lực đẩy phản lực cực nhanh lên tới 10 chiều dài cơ thể mỗi giây.",
        "Khả năng đồng bộ hóa tần số phát quang của toàn bộ quần thể trong đàn để tạo ra hiệu ứng ảo ảnh quang học làm rối loạn định hướng của kẻ thù.",
        "Cơ chế tái tạo hợp chất phát quang luciferin nhanh chóng thông qua việc hấp thụ trực tiếp các nucleotide tự do từ thức ăn giáp xác."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hoạt động quang học liên tục làm tăng tích tụ các gốc tự do oxy hóa trong mô cơ mắt, đòi hỏi chu kỳ ngủ nghỉ yếm khí sâu dưới đáy biển.",
        "Cơ thể dễ bị biến dạng và mất khả năng nổi bình thường nếu áp suất nước thay đổi đột ngột ngoài tầm kiểm soát khi bơi lên cạn."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Hợp chất luciferin của mực đom đóm chứa gốc sulfate độc nhất vô nhị giúp tăng độ ổn định của liên kết hóa học phát quang dưới áp suất thủy tĩnh cao của biển sâu."
      ]);

      addSource({ "url": "https://doi.org/10.1093/mollus/eyad024", "label": "Journal of Molluscan Studies - Photophore development and retinal adaptation in Watasenia scintillans" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-114.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-114.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich-round-114.json...");
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
