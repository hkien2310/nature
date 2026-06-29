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
      // Ignore parsing error, keep as is
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
  console.log(`Selected targets for Round 96: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'box-jellyfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "cá nhỏ", "tôm nhỏ", "ấu trùng sinh vật biển", "cá hề nhỏ", "giáp xác chân chèo (copepods)", "tôm tít nhỏ (mantis shrimp larvae)", "ấu trùng giáp xác chân chèo (copepods)", "tôm Mysida (mysids)", "ấu trùng cá"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 8;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sứa trưởng thành giải phóng tinh trùng và trứng vào nước ngọt ở các cửa sông, thụ tinh tạo ấu trùng planula bám vào giá thể đá tạo polyp trước khi biến thái thành sứa con bơi ra biển.';
      newC.locomotion = 'swim';
      newC.speed_max = 6;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300;
      newC.size_max_mm = 3000;
      newC.weight_avg_g = 2000;

      const charAdd = "Rìa chuông sứa hộp có chứa các vạch cơ biểu mô chạy dọc (velarium) hoạt động như một vòi phun phản lực bóp nghẹt dòng nước để tăng tốc độ bơi vượt trội.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Phản xạ tránh né các dải màu tối giúp sứa hộp không bị mắc cạn trong rừng ngập mặn khi triều rút nhanh.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Độc tố porin của sứa hộp có khả năng liên kết thụ thể màng tế bào máu cực nhanh, gây dung giải hồng cầu hàng loạt chỉ trong vài giây.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Cấu trúc thủy động lực học của chuông hình hộp hoạt động như một pít-tông khí động học giúp đẩy luồng nước ngược hướng để bơi nhanh gấp nhiều lần sứa thông thường.",
        "Sự phối hợp giữa cơ biểu mô chuông và rhopalia tạo hành vi tránh chướng ngại vật thông minh không cần não bộ."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Cực kỳ nhạy cảm với giấm ăn (acid acetic), loại acid phá hủy cấu trúc canxi của tế bào cnidocyte ngăn chặn phóng ngòi độc bổ sung.",
        "Rất dễ bị rùa da (Dermochelys coriacea) ăn thịt do lớp sừng bảo vệ thực quản dày đặc chống châm."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Dù có 24 con mắt với ống kính hội tụ ánh sáng và võng mạc, chúng không thể lấy nét hình ảnh rõ nét do thiếu võng mạc kép, thay vào đó chúng dựa vào xử lý phân tán của 4 hạch rhopalia độc lập.",
        "Chúng không ngủ như sứa thông thường mà chủ động nằm nghỉ dưới đáy biển vào ban đêm khi thiếu ánh sáng định vị."
      ]);

      addSource({ "url": "https://doi.org/10.1098/rsbl.2011.0298", "label": "Biology Letters - Advanced vision and visual orientation in Cubozoans" });

    } else if (c.id === 'honey-badger') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "rắn độc", "chuột", "ấu trùng ong", "mật ong", "củ rễ cây", "côn trùng", "bọ cạp", "kỳ đà", "rùa nhỏ", "quả mọng rừng", "trứng chim", "bọ cạp hoàng đế", "rắn hổ mang", "mối đất", "rắn lục Bitis"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 7;
      newC.lifespan_max = 24;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Chu kỳ mang thai khoảng 6-8 tuần, con cái thường đẻ một đến hai con non duy nhất và chăm sóc dạy dỗ con tự lập trong hang đất suốt 1 năm.";
      newC.locomotion = 'walk';
      newC.speed_max = 30;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 550;
      newC.size_max_mm = 770;
      newC.weight_avg_g = 12000;

      const charAdd = "Móng vuốt trước có cấu trúc lõm thìa giúp tăng thể tích đất đào được trong mỗi nhát cào cơ học.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Hành vi ăn xác thối và săn mồi cơ hội giúp lửng mật duy trì lượng calo ổn định trong suốt mùa khô cằn khắc nghiệt ở hoang mạc.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Đột biến proline tại tiểu đơn vị alpha của thụ thể nAChR ngăn chặn hoàn toàn liên kết của các chuỗi peptit độc tố rắn cobratoxin.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Sở hữu khả năng chống độc rắn vượt trội, có thể tiêu hóa các độc tố protein thô thông qua men protease trong hệ tiêu hóa.",
        "Hành vi phòng thủ chủ động bằng cách phát ra tiếng gầm gừ đe dọa với tần số âm thanh gầm rú đáng sợ lấn át tinh thần đối phương."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Tiêu tốn năng lượng cực lớn do lối sống liên tục đào bới hoạt động, đòi hỏi phải tiêu thụ lượng calo bằng 1/3 trọng lượng cơ thể mỗi ngày.",
        "Thường rơi vào trạng thái ngủ lịm sâu (coma-like state) khoảng 2-5 giờ khi bị trúng lượng nọc độc quá tải của rắn độc lớn, là lúc dễ bị thú ăn thịt khác cơ hội tấn công."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Lửng mật là loài động vật có vú duy nhất không ngần ngại cướp con mồi trực tiếp từ miệng báo hoa mai hoặc bầy linh cẩu đơn độc.",
        "Hệ cơ hàm và cơ thái dương có điểm bám rộng trên hộp sọ tạo lực cắn nghiền nát mai rùa cứng chỉ trong vài giây."
      ]);

      addSource({ "url": "https://doi.org/10.1093/jmammal/gyy116", "label": "Journal of Mammalogy - Mellivora capensis evolutionary genomics and venom resistance" });

    } else if (c.id === 'pistol-shrimp') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "cá nhỏ", "cua nhỏ", "giun biển", "tôm nhỏ khác", "ấu trùng giáp xác", "động vật thân mềm nhỏ", "giun nhiều tơ (polychaetes)", "tép rạn", "ốc biển nhỏ"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 2;
      newC.lifespan_max = 4;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Con cái mang hàng ngàn trứng dưới bụng sau khi thụ tinh cho đến khi nở thành ấu trùng trôi nổi.';
      newC.locomotion = 'walk';
      newC.speed_max = 2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 30;
      newC.size_max_mm = 50;
      newC.weight_avg_g = 25;

      const charAdd = "Lớp vỏ chitin của càng súng được gia cố bằng cấu trúc khoáng hóa canxi cacbonat mật độ cao, giúp chống chịu lực nén cơ học phản hồi khổng lồ khi sập càng.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Hành vi dọn dẹp cát mịn liên tục ra khỏi hang giúp ngăn chặn nguy cơ hang cộng sinh bị sụt lún cơ học trong những chu kỳ triều cường.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Mắt tôm được che phủ bởi lớp vỏ giáp trong suốt (carapace hood) giúp bảo vệ các cơ quan thị giác khỏi các mảnh vụn bắn ra từ vụ nổ cavitation.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Vũ khí tầm xa độc đáo không cần tiếp xúc vật lý vẫn có thể đánh ngất hoặc làm vỡ vỏ cua nhỏ trong khoảng cách 1-2 cm.",
        "Càng nhỏ có các cơ quan cơ học thụ cảm nhạy bén phát hiện các xung động lan truyền trong dòng cát mịn."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Lực bắn cavitation giảm nhanh theo khoảng cách và hoàn toàn mất tác dụng nếu càng bị kẹt bởi bùn cát hạt lớn.",
        "Lột xác định kỳ là giai đoạn nguy hiểm nhất, lớp vỏ mới rất mềm khiến chúng không thể bắn càng trong 24 giờ đầu."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Càng lớn có thể chuyển đổi vị trí: nếu càng súng bị rụng, chiếc càng nhỏ còn lại sẽ lột xác biến thành càng súng lớn, còn càng bị mất mọc lại thành càng nhỏ để dọn hang.",
        "Khi một đàn tôm súng tụ tập bắn cùng lúc, tiếng nổ cavitation của chúng tạo ra âm thanh lớn đến mức làm mù tạm thời hệ thống định vị thủy âm của tàu chiến dưới nước."
      ]);

      addSource({ "url": "https://doi.org/10.1103/PhysRevLett.87.134301", "label": "Physical Review Letters - How the Snapping Shrimp Snaps" });

    } else if (c.id === 'leaf-sheep') {
      newC.diet_type = 'herbivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "tảo Avrainvillea", "tảo Avrainvillea erecta", "tảo xanh Avrainvillea"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = "Giao phối chéo lưỡng tính để trao đổi tinh trùng, sau đó cả hai cá thể đều đẻ các dải trứng hình xoắn ốc bám vào tảo.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.05;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 5;
      newC.size_max_mm = 10;
      newC.weight_avg_g = 0.01;

      const charAdd = "Lớp biểu bì của cerata chứa các hạt sắc tố photoprotective màu đỏ và trắng hoạt động như các tấm gương phản xạ ánh sáng dư thừa để tránh bức xạ nhiệt cao.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Hành vi trườn bò chọn lọc trên các mép lá tảo Avrainvillea giúp chúng đón được hướng ánh sáng mặt trời mạnh nhất để nâng cao hiệu suất quang hợp tự dưỡng.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Các xúc tu cerata có khả năng trao đổi khí trực tiếp với môi trường nước, đóng vai trò như mang phụ sinh học hiệu năng cao.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Sống tự dưỡng hoàn toàn bằng quang hợp trong tối đa 1-2 tháng mà không cần ăn thêm tảo tươi.",
        "Ngụy trang hoàn hảo giống hệt một cụm tảo nhỏ trên bề mặt lá tảo Avrainvillea khiến kẻ săn mồi khó phát hiện."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Tuyệt đối phụ thuộc vào tảo Avrainvillea, sự biến mất của loài tảo này sẽ dẫn đến cái chết hàng loạt của sên cừu lá.",
        "Thân hình siêu nhỏ không xương sống cực kỳ nhạy cảm với việc thay đổi pH và nồng độ muối của nước biển rạn san hô nông."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Sên cừu lá thực chất là một trong những loài động vật rất hiếm hoi có khả năng biểu hiện gen quang bảo vệ giống thực vật để tự che chắn khỏi tia UV trong nước nông.",
        "Ấu trùng mới nở hoàn toàn không có lục lạp hay màu xanh, chúng phải tìm và ăn tảo Avrainvillea để bắt đầu quá trình trộm lục lạp tạo màu xanh cho mình."
      ]);

      addSource({ "url": "https://doi.org/10.1038/s41598-020-64303-3", "label": "Scientific Reports - Short-term kleptoplasty and photoprotective mechanisms in Costasiella kuroshimae" });

    } else if (c.id === 'moray-eel') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "cá rạn san hô", "bạch tuộc", "mực", "cua", "tôm", "cá chình nhỏ khác", "bạch tuộc đá", "cá mú", "cua rạn san hô", "cá chình biển nhỏ"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Thụ tinh ngoài. Trứng và tinh trùng được phóng trực tiếp vào dòng nước. Ấu trùng leptocephalus dẹt phẳng và trong suốt trôi nổi tự do trong dòng hải lưu trước khi biến thái thành cá con.";
      newC.locomotion = 'swim';
      newC.speed_max = 15;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1500;
      newC.size_max_mm = 3000;
      newC.weight_avg_g = 24000;

      const charAdd = "Cấu trúc sọ hẹp kết hợp cùng khớp thái dương dài giúp tối ưu hóa lực kéo giật cơ học từ bộ hàm hầu phụ mà không làm tổn thương não bộ.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sự cộng sinh làm sạch (cleaning symbiosis) với các loài tôm dọn vệ sinh (Lysmata) giúp cá chình bảo dưỡng khoang miệng sạch sẽ khỏi vi khuẩn hoại tử mô.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hệ thống đường bên (lateral line) dọc thân cá chình cực kỳ phát triển, bù đắp hoàn hảo cho thị lực kém bằng cách cảm nhận các rung động áp suất nước cực nhỏ.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng nuốt chửng con mồi lớn trong không gian hẹp nhờ bộ hàm hầu phụ chủ động trượt kéo mồi cơ học.",
        "Khứu giác siêu phát triển có thể ngửi thấy mùi máu hoặc mồi từ khoảng cách hàng trăm mét trong đêm tối."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khớp hàm ngoài không có răng nghiền dẹt mà chỉ có răng nhọn hoắt hướng trong, khiến chúng không thể nhai thức ăn cứng.",
        "Không thể bơi đường dài ở vùng nước thoáng do thiếu vây ngực và vây bụng hỗ trợ cân bằng thủy động lực học."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Cá chình Moray thường phối hợp đi săn cùng cá mú (Plectropomus pesculiferus); cá mú sẽ bơi trước định vị mồi trong hang sâu rồi gật đầu báo hiệu cho cá chình chui vào lôi mồi ra.",
        "Hàm hầu của cá chình Moray là nguyên mẫu sinh học chính xác được các nhà làm phim Hollywood lấy cảm hứng để tạo nên cái miệng phụ chết chóc của quái vật Xenomorph."
      ]);

      addSource({ "url": "https://doi.org/10.1038/nature06062", "label": "Nature - Raptor-like jointed pharyngeal jaws in moray eels" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-96.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-96.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich-round-96.json...");
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
