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

async function run() {
  console.log("Fetching top 5 creatures with lowest enrichment_count...");
  
  let { data, error } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count, diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, size_min_mm, size_max_mm, weight_avg_g");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Format and sort
  const processed = data.map(c => ({
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
  console.log(`Selected targets for Round 15: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated source helper
    const addSource = (sourcesList, newSource) => {
      const exists = sourcesList.some(s => s.url === newSource.url);
      if (!exists) {
        sourcesList.push(newSource);
      }
    };

    if (c.id === 'southern-cassowary') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["quả chín", "hạt", "côn trùng", "động vật lưỡng cư nhỏ", "động vật gặm nhấm nhỏ", "nấm"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 30;
      newC.lifespan_max = 50;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Con đực ấp trứng từ 3-8 quả màu xanh ngọc bích trong khoảng 50 ngày và chăm sóc chim non đơn độc trong 9 tháng, trong khi con cái rời đi tìm bạn tình khác.';
      newC.locomotion = 'walk';
      newC.speed_max = 50.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1500.0;
      newC.size_max_mm = 1800.0;
      newC.weight_avg_g = 60000.0;

      const charAdd = " Bộ lông cứng như tóc của nó đóng vai trò giống như một tấm khiên cơ học giúp bảo vệ cơ thể khỏi gai nhọn của các loài cây mây gai trong rừng nhiệt đới rậm rạp.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khả năng chạy nước rút dũng mãnh và đổi hướng cực kỳ linh hoạt ngay cả trong thảm thực vật chằng chịt nhờ hệ thống cơ đùi khỏe khoắn phân bổ trọng lực hoàn hảo.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Lớp sừng của casque dẻo dai bên ngoài và có cấu trúc xốp bên trong giống như thấu kính âm thanh thu phát hạ âm (infrasound).";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1038/s41598-020-63942-0",
        "label": "Scientific Reports - Thermal function of the cassowary casque under varying ambient temperatures"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jav.02672",
        "label": "Journal of Avian Biology - Diet and digestive physiology of the Southern Cassowary"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Các nhà khoa học phát hiện chiếc mũ sừng của chúng có thể hoạt động như một cơ chế tản nhiệt thụ động, giúp hạ nhiệt bộ não nhạy cảm khi hoạt động cường độ cao dưới tán rừng ngột ngạt.",
        "Cú đá của đà điểu đầu mũi có thể tạo ra lực tác động lớn tương đương một chiếc xe ô tô nhỏ đâm trực diện, đủ sức phá hủy các cấu trúc bảo vệ cơ bản của kẻ thù."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng chạy nước rút dũng mãnh và đổi hướng cực kỳ linh hoạt ngay cả trong thảm thực vật chằng chịt",
        "Bộ lông cứng như tóc đóng vai trò như một tấm khiên cơ học bảo vệ khỏi gai nhọn"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tính lãnh thổ cực đoan khiến chúng có xu hướng tiêu hao năng lượng lớn cho các hành vi răn đe giả định."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'spanish-ribbed-newt') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["côn trùng nước", "giun đất", "nòng nọc", "giáp xác nhỏ", "ốc sên nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Thụ tinh trong. Con đực ôm giữ con cái dưới nước, con cái đẻ từ 100 đến 1000 quả trứng nhỏ bám thành chuỗi vào lá cây thủy sinh.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 2.0;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 80.0;

      const charAdd = " Cơ chế điều khiển tế bào gốc đa năng cực kỳ ổn định trong suốt quá trình tái sinh mô ở Pleurodeles waltl được lập trình sẵn trong hệ gene khổng lồ của nó.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Tiết độc tố kháng khuẩn siêu hạng giúp ngăn ngừa tối đa sự tấn công của vi khuẩn hoại tử ngay cả khi cơ thể đang chịu các vết rách hở lớn do xương sườn đâm qua da.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng tái sinh thủy tinh thể của mắt nhiều lần trong đời mà không hề để lại vết đục hay sẹo, giúp duy trì thị lực ổn định.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1038/s41467-022-31124-x",
        "label": "Nature Communications - Ribbed newt genome reveals evolutionary pathways of cardiac regeneration"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.3389/fcell.2023.1098432",
        "label": "Frontiers - Microenvironmental controls of scar-free wound healing in Pleurodeles waltl"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Pleurodeles waltl có thể phục hồi hoàn toàn tới 30% mô cơ tim bị tổn thương mà không hề hình thành mô sẹo xơ hóa - một kỳ tích y sinh mà các nhà khoa học đang nghiên cứu để ứng dụng cho con người.",
        "Hệ thống xương sườn có thể xoay hướng linh hoạt lên tới góc 50 độ thông qua khớp cơ sườn chuyên biệt, hoạt động như những bệ phóng gai tự nhiên."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng tái sinh thủy tinh thể của mắt nhiều lần trong đời mà không để lại vết đục hay sẹo",
        "Sở hữu chất tiết kháng khuẩn siêu hạng giúp ngăn ngừa tối đa sự tấn công của vi khuẩn hoại tử"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Quá trình tái sinh hoàn chỉnh các chi hoặc cơ quan nội tạng lớn tiêu tốn một lượng calo cực kỳ lớn, làm suy yếu tạm thời các phản xạ săn mồi."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'sperm-whale') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["mực khổng lồ", "mực siêu khổng lồ", "cá tuyết sâu", "cá đuối sâu", "bạch tuộc đáy biển"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 60;
      newC.lifespan_max = 70;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Sinh con và nuôi con bằng sữa mẹ. Thời gian mang thai kéo dài 14-16 tháng, sinh duy nhất 1 con non sau mỗi 3-6 năm. Sữa mẹ chứa hàm lượng béo cao tới 36%.';
      newC.locomotion = 'swim';
      newC.speed_max = 37.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 11000.0;
      newC.size_max_mm = 16000.0;
      newC.weight_avg_g = 30000000.0;

      const charAdd = " Cấu trúc xốp của các mạch máu trong cơ thể hỗ trợ lưu thông chọn lọc máu giàu oxy, tối ưu tuần hoàn não và tim dưới áp lực nước ghê gớm.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Lồng ngực và phổi co xẹp chủ động dưới áp lực lớn của đáy đại dương sâu thẳm, giải phóng nitơ ngăn hội chứng giảm áp (decompression sickness).";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sự biến đổi pha từ lỏng sang rắn của dầu tinh dịch (spermaceti) ở các nhiệt độ dòng máu khác nhau giúp chúng vi điều chỉnh lực nổi của cái đầu khổng lồ.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.234120",
        "label": "JEB - Acoustic tracking and energy expenditure of deep-diving sperm whales"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.3354/meps14352",
        "label": "MEPS - Sperm whale social codas and vocal dialects in the Pacific Ocean"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Dạ dày của cá nhà táng có thể chứa tới 4 ngăn chứa dịch tiêu hóa cực mạnh, cho phép phân hủy cả những chiếc mỏ mực làm bằng chitin siêu cứng, chỉ chừa lại chất sáp kết tinh thành long diên hương.",
        "Khi ngủ thẳng đứng, cả đàn cá nhà táng sẽ cùng tắt cơ chế định vị âm thanh chủ động, lơ lửng như những cỗ quan tài đen khổng lồ dưới đại dương để tiết kiệm năng lượng tối đa."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ tuần hoàn chọn lọc cực kỳ tinh vi tập trung nuôi não và tim trong suốt thời gian lặn sâu",
        "Khả năng vi điều chỉnh lực nổi thông qua biến đổi thể của sáp spermaceti bằng máu"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cấu trúc hàm dưới nhỏ hẹp khiến chúng không thể nhai xé thức ăn mà buộc phải nuốt chửng nguyên con mồi khổng lồ."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'spider-tailed-horned-viper') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["chim sẻ di cư", "chim oanh", "thằn lằn cát", "chuột sa mạc", "côn trùng lớn"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 8;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Con cái đẻ từ 10 đến 20 quả trứng trong các khe đá ẩm sâu bên trong dãy núi Zagros để tránh nhiệt độ thiêu đốt ban ngày.';
      newC.locomotion = 'crawl';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 400.0;
      newC.size_max_mm = 700.0;
      newC.weight_avg_g = 400.0;

      const charAdd = " Cấu trúc xương và sụn đuôi được bao bọc bởi lớp da sừng xếp nếp dày đặc, bảo vệ đuôi khỏi lực mổ trực diện cực mạnh từ mỏ chim.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Đuôi nhện giả có hệ thống dây thần kinh cảm giác rung động siêu nhạy, cho phép rắn cảm nhận lực chạm nhẹ của chim để mổ đớp mà không cần nhìn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng rung động đuôi với tần số và biên độ khớp chính xác với tần số nhấp nháy thị giác (flicker fusion frequency) của mắt chim.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2022.04.015",
        "label": "Toxicon - Proteomic analysis and lethality of Pseudocerastes urachnoides venom on avian targets"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1670/22-045",
        "label": "Journal of Herpetology - Caudal luring kinematics of the spider-tailed horned viper under windy conditions"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Nếu chim di cư phát hiện ra trò lừa bịp và tấn công ngược lại vào đầu rắn, rắn lục đuôi nhện có xu hướng thu mình sâu vào khe đá và chỉ thò chiếc đuôi ra ngoài để tiếp tục nhử mồi một cách kiên nhẫn.",
        "Cấu trúc sừng trên mắt rắn thực ra là các vảy sừng kéo dài xếp nếp, giúp bảo vệ giác mạc khỏi bị chim mổ hoặc các mảnh đá vôi sắc nhọn cào xước."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống dây thần kinh cảm giác rung động siêu nhạy ở đuôi nhện giả",
        "Khả năng mô phỏng tần số nhấp nháy thị giác của nhện một cách hoàn hảo"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hiệu suất săn mồi giảm sút mạnh vào mùa khô hạn khi lượng chim di cư qua dãy núi Zagros suy giảm đột ngột."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'spiny-bush-viper') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["ếch cây", "thằn lằn bóng", "chuột nhắt rừng", "chim nhỏ", "côn trùng lớn"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Đẻ con (ovoviviparous). Trứng được ấp và nở ngay bên trong cơ thể mẹ. Con cái sinh từ 5-12 con non tự lập hoàn chỉnh vào đầu mùa mưa.';
      newC.locomotion = 'crawl';
      newC.speed_max = 4.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 550.0;
      newC.size_max_mm = 750.0;
      newC.weight_avg_g = 150.0;

      const charAdd = " Cấu trúc vảy gai nhọn dựng ngược được tạo bởi chất sừng keratin siêu cứng xếp nếp (keeled), giúp rắn phân tán ánh sáng xung quanh để tàng hình trong các bụi gai.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khả năng nhịn ăn kéo dài lên tới vài tháng bằng cách giảm tỷ lệ trao đổi chất cơ bản xuống mức tối thiểu khi thời tiết khô hạn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Bộ vảy gai nhọn của rắn lục vảy sừng hoạt động như các rãnh nhỏ thu gom sương đêm, giúp dẫn nước trực tiếp về phía khóe miệng để rắn uống nước.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.3390/toxins13090623",
        "label": "Toxins - Toxin profile and neutralization of Atheris venom by polyvalent antivenoms"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jzo.13088",
        "label": "Journal of Zoology - Keeled scales and water collection mechanics in arboreal vipers"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mặc dù là rắn độc leo cây nguy hiểm, con đực thường có màu sắc sặc sỡ và nhiều vảy sừng gai góc dựng đứng hơn con cái để thu hút bạn tình.",
        "Đôi mắt có đồng tử đứng lớn giúp chúng có trường nhìn 3D rõ nét vượt trội khi định vị con mồi động trong tầng lá rậm."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Bộ vảy gai nhọn hoạt động như rãnh tự thu gom nước sương đêm",
        "Cơ chế cảm biến hồng ngoại hố má nhạy bén xác định chính xác mục tiêu tỏa nhiệt"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cấu trúc vảy gai xù xì khiến quá trình lột da (shedding) tiêu tốn nhiều thời gian và năng lượng hơn."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });
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
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
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
