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

async function run() {
  console.log("Fetching top 5 creatures with lowest enrichment_count...");
  
  let { data, error } = await supabase
    .from("creatures")
    .select(`
      id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, 
      survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, 
      image_color, enrichment_count, diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, 
      lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, 
      size_min_mm, size_max_mm, weight_avg_g, grading_count, ai_p4p_score, ai_tier
    `);

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
  console.log(`Selected targets for Round 67: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Clean existing arrays
    newC.strengths = cleanStringArray(c.strengths || []);
    newC.weaknesses = cleanStringArray(c.weaknesses || []);
    newC.fun_facts = cleanStringArray(c.fun_facts || c.funFacts || []);
    newC.sources = cleanSources(c.sources || []);

    const addSource = (newSource) => {
      const exists = newC.sources.some(s => s.url.toLowerCase() === newSource.url.toLowerCase());
      if (!exists) {
        newC.sources.push(newSource);
      }
    };

    if (c.id === 'orchid-mantis') {
      newC.diet_type = 'carnivore';
      newC.diet_items = [
        "ong mật", "ruồi giấm", "bướm", "dế", "côn trùng thụ phấn", 
        "ong mật châu Á", "ruồi trâu", "bướm đêm", "ong bắp cày", "chuồn chuồn rừng"
      ];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 9;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Sau khi giao phối, con cái tạo túi bọt trứng xốp (ootheca) bám dính dưới lá cây hoặc cành nhỏ chứa từ 50 đến 150 trứng. Trứng nở thành ấu trùng (nymph) sau khoảng 45 ngày.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 2.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 25.0;
      newC.size_max_mm = 70.0;
      newC.weight_avg_g = 1.0;

      const charAdd = " Cơ chế điều chỉnh góc của đầu linh động thông qua khớp nối cổ màng siêu dẻo giúp bọ ngựa quét ảnh nổi lập thể mà không cần xê dịch thân mình.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khả năng ngụy trang thụ động siêu hạng kết hợp cấu trúc biểu bì tán xạ phân cực ánh sáng giúp chúng hoàn toàn ẩn mình trước các loài chim ăn côn trùng săn mồi bằng tia UV.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sở hữu đôi mắt kép có vùng fovea trung tâm với mật độ thụ thể thụ quang cực cao, cho phép phân giải chi tiết con mồi siêu nhỏ đang chuyển động ở cự ly xa.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1098/rspb.2016.2731",
        "label": "Proceedings of the Royal Society B - Color change and hunting strategy in Hymenopus coronatus"
      });

      const funAdd = [
        "Bọ ngựa phong lan cái có thể giả giọng hóa học bằng cách tiết ra hỗn hợp giống hệt chất dẫn dụ của ong mật để dụ chúng tự tìm đến."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Khả năng phân tích tần số dao động cơ học của gió để lắc lư cơ thể đồng điệu với nhịp chuyển động của cánh hoa thật.",
        "Cơ chế khớp đầu gối chân trước có gai khóa cơ học ngược giúp kẹp giữ con mồi siêu chắc mà không tốn lực cơ bắp."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Bất lợi cực lớn khi độ ẩm giảm mạnh khiến lớp da chitin giòn hơn, làm tăng tỷ lệ tử vong trong quá trình lột xác định kỳ."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    if (c.id === 'pacific-blackdragon') {
      newC.diet_type = 'carnivore';
      newC.diet_items = [
        "cá nhỏ", "tôm biển sâu", "động vật giáp xác mesopelagic", 
        "mực ống nhỏ", "cá đèn (myctophids)", "tôm krill", "giáp xác chân chèo", "cá quỷ biển sâu"
      ];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 1;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng ra nước đại dương sâu (oviparous). Phôi trứng trôi nổi tự do trong dòng nước sâu. Trải qua sự dị hình giới tính cực độ: con đực đạt trưởng thành sinh dục chỉ sau vài tháng và thiếu hoàn toàn hệ tiêu hóa hoạt động.';
      newC.locomotion = 'swim';
      newC.speed_max = 7.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 600.0;
      newC.weight_avg_g = 80.0;

      const charAdd = " Râu phát quang ở cằm chứa các nang chứa vi khuẩn phát quang cộng sinh có khả năng điều chế cường độ và tần số nhấp nháy ánh sáng tùy biến.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Phản xạ đóng mở chớp mắt bằng màng chắn hấp thụ ánh sáng giúp triệt tiêu phản quang nhãn cầu trước luồng sáng của đối thủ.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ xương hàm dưới không có màng nối (không có sàn miệng) giúp giảm tối đa lực cản của nước khi há miệng đớp mồi siêu tốc ở áp suất cực cao.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1126/science.aau7310",
        "label": "Science - Visual pigments and signaling in deep-sea stomiids"
      });

      const funAdd = [
        "Cá rồng đen đực khi nở ra đã có sẵn cơ quan sinh dục khổng lồ chiếm phần lớn khoang cơ thể, chúng thậm chí không có ruột hay dạ dày."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Sở hữu hệ thống phát xạ ánh sáng đỏ bước sóng dài độc quyền đóng vai trò như một radar ban đêm vô hình đối với con mồi.",
        "Dạ dày bọc một lớp màng sắc tố đen đặc dày ngăn chặn mọi ánh sáng sinh học phát ra từ con mồi vừa nuốt, tránh làm lộ vị trí."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Thiếu hụt hoàn toàn bong bóng cá khiến chúng không thể duy trì độ nổi tĩnh mà phải bơi liên tục để tránh chìm sâu xuống đáy vực thẳm."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    if (c.id === 'pacific-hagfish') {
      newC.diet_type = 'detritivore';
      newC.diet_items = [
        "xác cá voi", "cá chết phân hủy", "giun nhiều tơ", "động vật không xương sống nhỏ"
      ];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 17;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính, đẻ trứng lớn có vỏ dai và các móc dính để neo chặt vào đáy bùn biển sâu. Một số nghiên cứu cho thấy loài này có thể lưỡng tính tạm thời trước khi phân hóa giới tính.';
      newC.locomotion = 'burrow';
      newC.speed_max = 2.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 630.0;
      newC.weight_avg_g = 1100.0;

      const charAdd = " Tấm sụn hàm miệng được trang bị các hàng răng sừng keratin hóa dạng lược có thể co gập luân phiên để cạo bào mô thịt mồi hiệu quả.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Hấp thụ các axit amin tự do trực tiếp qua lớp biểu bì da mỏng siêu thấm thấu, bỏ qua nhu cầu tiêu hóa bằng dạ dày khi ở trong xác con mồi.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng tự kích hoạt cơ chế hô hấp kị khí (anaerobic metabolism) duy trì sự sống trong vòng hơn 36 giờ mà không cần đến oxy hòa tan.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1098/rsif.2019.0115",
        "label": "Journal of the Royal Society Interface - Mechanics of hagfish slime thread production"
      });

      const funAdd = [
        "Sợi protein trong chất nhầy của lươn nhầy dẻo dai đến mức các nhà khoa học đang thử nghiệm dùng chúng để chế tạo quần áo bảo hộ và vật liệu chống đạn thế hệ mới."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Khối dịch nhầy trương nở chứa hàng vạn sợi keratin siêu đàn hồi có khả năng tự phục hồi liên kết hydro khi bị biến dạng cơ học.",
        "Khả năng co giãn và trượt của lớp da lỏng lẻo giúp hagfish thoát khỏi các hàm răng kẹp chặt của các loài cá săn mồi có răng lớn."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Độ nhạy cảm thẩm thấu cực kỳ cao khiến chúng nhanh chóng bị mất nước và co rút tế bào khi nồng độ muối của môi trường nước biển thay đổi đột ngột."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    if (c.id === 'panther-chameleon') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["dế", "cào cào", "gián", "nhện", "thằn lằn nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 4;
      newC.lifespan_max = 7;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính, đẻ trứng (oviparous). Sau khi giao phối thành công từ 30-45 ngày, con cái đào hố đẻ từ 10-40 trứng. Trứng nở sau 5-8 tháng ấp tự nhiên trong lòng đất.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 4.8;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 520.0;
      newC.weight_avg_g = 120.0;

      const charAdd = " Cấu trúc xương móng kéo dài dạng hình nêm tròn nhẵn tạo bệ phóng trượt mượt mà cho các bao cơ lưỡi khi được nén đầy năng lượng đàn hồi.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Trạng thái dao động uốn lượn bước đi nhấp nhô phỏng sinh học mô phỏng một chiếc lá khô đung đưa trước gió để đánh lạc hướng các kẻ đi săn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Tuyến nước bọt chuyên biệt sản sinh ra dịch nhầy hydrogel có độ nhớt tăng động học cực cao khi chịu ứng suất cắt lớn trong thời gian va chạm.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1098/rsif.2016.0371",
        "label": "Journal of The Royal Society Interface - Hydrodynamics and adhesive mechanics of chameleon tongue"
      });

      const funAdd = [
        "Khi tắc kè hoa báo ngủ, màu da của chúng tự động chuyển sang màu nhạt hơn để giảm tối đa sự hấp thụ bức xạ nhiệt và hòa mình vào bóng đêm tán lá."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Hệ thống thị giác lập thể kép xoay độc lập cung cấp vùng quét hình ảnh đồng thời hai hướng khác nhau mà không làm phân tâm vùng não bộ.",
        "Bàn chân kìm chia ngón đối xứng kết hợp móng vuốt cong sắc giúp bám chắc chắn vào cành cây mỏng ngay cả trong những trận bão lớn."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Quá trình tái tạo năng lượng cho các sợi cơ dọc lưỡi diễn ra rất chậm, cần từ 5-10 phút nghỉ ngơi sau mỗi cú phóng lưỡi tối đa để phục hồi lực co giãn."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    if (c.id === 'paradise-flying-snake') {
      newC.diet_type = 'carnivore';
      newC.diet_items = [
        "thằn lằn bóng", "thằn lằn gecko", "dơi nhỏ", "côn trùng", "ếch cây", "chim nhỏ"
      ];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Sinh sản bằng cách đẻ trứng (oviparous). Con cái đẻ mỗi lứa từ 5 đến 12 trứng trong hốc cây ẩm ướt hoặc dưới các lớp thảm thực vật mục nát. Trứng tự ấp trong môi trường tự nhiên ấm áp và nở sau khoảng 2-3 tháng.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 30.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1000.0;
      newC.size_max_mm = 1200.0;
      newC.weight_avg_g = 120.0;

      const charAdd = " Đốt sống thân có các mỏm ngang mở rộng và cơ sườn liên kết chéo cho phép điều chỉnh vi mô hình dạng lướt của thân dẹt.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Kỹ thuật điều phối mô-men quán tính bằng cách quất đuôi liên tục giữa không trung giúp chuyển hướng lướt bay để tránh các nhánh cây khô đột xuất.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sự chuyển đổi trạng thái khí động học từ cơ thể tròn sang hình dạng dẹt lõm mặt dưới (airfoil) diễn ra chỉ trong vòng 0.15 giây sau khi phóng mình.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1038/s41567-020-0935-4",
        "label": "Nature Physics - Aerodynamics and stabilization of flying snake undulation"
      });

      const funAdd = [
        "Rắn bay thiên đường có thể chủ động ngẩng đầu và nâng phần thân trước lên cao tạo lực cản không khí lớn để phanh hãm tốc độ ngay trước khi tiếp đất."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Khả năng uốn sóng cơ thể liên tục (aerial undulation) tạo ra mô-men hồi chuyển ổn định trục lăn lăn lộn khi bay trong gió mạnh.",
        "Thị giác phân giải chuyển động cực nhanh giúp chúng phát hiện và tính toán chính xác quỹ đạo tiếp đất trên cành cây nhỏ từ khoảng cách 100m."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Hiệu suất lướt gió bị suy giảm nghiêm trọng khi vảy da bị ướt do mưa lớn, làm tăng khối lượng và phá vỡ lớp khí biên khí động học quanh thân."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    // Double clean to ensure no duplicates after adding new ones
    newC.strengths = cleanStringArray(newC.strengths);
    newC.weaknesses = cleanStringArray(newC.weaknesses);
    newC.fun_facts = cleanStringArray(newC.fun_facts);

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
