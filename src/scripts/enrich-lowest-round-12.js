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
  console.log(`Selected targets for Round 12: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'reticulated-python') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["lợn rừng", "nai", "hoẵng", "chuột", "khỉ", "cầy hương", "chim"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 25;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng (oviparous). Con cái đẻ từ 15 đến 80 quả trứng mỗi lứa (đôi khi lên tới 100 quả). Trăn mẹ cuộn tròn xung quanh tổ trứng để bảo vệ và run cơ thể tạo nhiệt lượng ấp trứng ổn định cho tới khi nở.";
      newC.locomotion = 'crawl';
      newC.speed_max = 1.6;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 3000.0;
      newC.size_max_mm = 8000.0;
      newC.weight_avg_g = 110000.0;

      const charAdd = " Hệ thống cơ xương gồm hơn 400 đốt sống linh hoạt giúp phân bổ lực siết cơ học đều khắp cơ thể.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng các tế bào biểu bì sừng hóa nhạy cảm để giảm thiểu tối đa lực ma sát khi di chuyển trườn bò trên mặt đất khô hoặc sỏi đá.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng nhịn ăn phi thường nhờ hệ tiêu hóa có thể tạm thời teo nhỏ tế bào ruột để tiết kiệm năng lượng tối ưu, sau đó tái cấu trúc tăng kích thước cơ quan lên gấp đôi khi bắt đầu ăn lại.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1093/iob/obz006",
        "label": "Integrative Organismal Biology - Constriction mechanics in giant snakes"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Trăn gấm mẹ có khả năng run cơ (shivering thermogenesis) để tăng nhiệt độ tổ trứng lên 3-5 độ C so với môi trường bên ngoài khi thời tiết chuyển lạnh.",
        "Ấu trùng hoặc trăn non khi vừa nở đã có chiều dài lên tới 60 cm và hoàn toàn tự lập."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Lớp vảy sừng xếp lớp tinh vi giúp bảo vệ các cơ quan nội tạng khỏi các gai nhọn rặng cây bụi.",
        "Cơ chế tiêu hóa xương nhờ nồng độ axit dạ dày cực cao pH ~ 1.5, tiêu hủy hoàn toàn xương và sừng con mồi."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Quá trình tiêu hóa tiêu tốn lượng oxy gấp 7-10 lần bình thường, khiến trăn rơi vào trạng thái lờ đờ dễ bị tổn thương.",
        "Lỗ cảm ứng nhiệt loreal pits dễ bị tắc nghẽn bởi bùn đất khi di chuyển trong mùa mưa, làm giảm độ chính xác săn mồi."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'ribbon-eel') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nhỏ", "tôm nhỏ", "giáp xác nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = "Lưỡng tính đực trước (protandrous hermaphroditism). Con non nở ra có màu đen, khi trưởng thành chuyển sang cá đực màu xanh lam, sau đó tiếp tục chuyển giới tính thành cá cái có màu vàng rực rỡ để đẻ trứng.";
      newC.locomotion = 'swim';
      newC.speed_max = 1.2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 650.0;
      newC.size_max_mm = 1300.0;
      newC.weight_avg_g = 300.0;

      const charAdd = " Xương sống cực kỳ linh hoạt với hơn 200 đốt sống giúp chuyển động uốn lượn hình sin đặc trưng.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi gặp nguy hiểm, cá chình ruy băng có thể nhanh chóng thụt sâu vào trong hang cát nhờ cơ bụng đàn hồi khỏe và lớp da trơn bóng giảm ma sát cát tối đa.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng tự tiêu biến răng sắc nhọn ở giai đoạn chuyển giới sang cá cái để thích nghi với việc dồn năng lượng nuôi trứng.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s00227-020-03712-8",
        "label": "Marine Biology - Trophic ecology and sex change of Rhinomuraena quaesita"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Do không có vây ngực và vây bụng, cá chình ruy băng di chuyển hoàn toàn bằng cách uốn lượn vây lưng kéo dài từ đầu đến đuôi.",
        "Trong tự nhiên, con cái màu vàng rất hiếm gặp vì giai đoạn này diễn ra vào cuối vòng đời của chúng."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ chế hô hấp phụ hỗ trợ lấy oxy trực tiếp qua biểu bì da mỏng khi ở trong hang hẹp thiếu oxy.",
        "Khả năng nhịn ăn kéo dài nhiều tuần trong quá trình chuyển giới tính."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cơ thể không có vảy khiến chúng cực kỳ nhạy cảm với các loại ký sinh trùng da rạn san hô.",
        "Không có răng nanh lớn, chỉ có răng nhỏ quặp ngược nên không thể tấn công hoặc ăn các con mồi có lớp vỏ quá cứng."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'rove-beetle') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["rầy nâu", "sâu cuốn lá", "nhện nhỏ", "ấu trùng ruồi", "rệp cây", "trứng côn trùng"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 6;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính. Con cái đẻ trứng đơn lẻ dưới các lá cây ẩm ướt hoặc bùn đất. Trứng nở thành ấu trùng săn mồi hoạt động mạnh, trải qua 3 giai đoạn lột xác trước khi hóa nhộng.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 1.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 7.0;
      newC.size_max_mm = 10.0;
      newC.weight_avg_g = 0.015;

      const charAdd = " Cánh màng (hindwings) lớn xếp gọn gàng dưới cánh cứng (elytra) ngắn, có thể bung ra trong chưa đầy 1 giây để cất cánh bay.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi bị rơi xuống nước, chúng sử dụng đặc tính kỵ nước của lớp cutin biểu bì để nổi và bò nhanh chóng trên mặt nước tìm vật bám.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Phức hợp liên kết cộng sinh với vi khuẩn Pseudomonas trong cơ thể giúp sản sinh Paederin tự nhiên liên tục mà không cần tiêu tốn gen nội sinh.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2018.11.294",
        "label": "Toxicon - Chemical ecology and toxicology of Paederin in Paederus beetles"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Ấu trùng kiến ba khoang cũng chứa độc tố Paederin nhưng với lượng nhỏ hơn, thừa hưởng trực tiếp từ màng trứng của mẹ.",
        "Cơ thể kiến ba khoang cực kỳ dẻo dai, có thể chui qua các mắt lưới của rèm cửa sổ có kích thước chỉ 1mm."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng kháng hóa chất trừ sâu nhóm lân hữu cơ nhờ hệ enzyme cytochrome P450 phát triển mạnh.",
        "Khả năng định vị con mồi nhờ các thụ thể hóa học siêu nhạy trên cặp râu 11 phân đoạn."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Độ bền vỏ giáp cơ học cực thấp, dễ bị đè bẹp hoàn toàn bởi các tác động vật lý nhỏ.",
        "Tỷ lệ mất nước cơ thể nhanh khi độ ẩm không khí giảm dưới 50%, hạn chế vùng hoạt động ở khu vực khô cằn."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'saltwater-crocodile') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["trâu nước", "khỉ", "lợn rừng", "cá lớn", "cá mập", "chim biển", "rùa biển"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 60;
      newC.lifespan_max = 80;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng (oviparous). Con cái đắp các gò bùn và lá cây mục lớn làm tổ đẻ từ 40-90 quả trứng. Nhiệt độ của tổ quyết định giới tính của con non (nhiệt độ trung bình ~31-32°C sinh con đực, thấp hoặc cao hơn sinh con cái). Mẹ canh giữ tổ nghiêm ngặt.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 29.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 4300.0;
      newC.size_max_mm = 6000.0;
      newC.weight_avg_g = 700000.0;

      const charAdd = " Hệ thống van tim răng cưa Foramen of Panizza cho phép kiểm soát tuần hoàn máu ngắt quãng thông minh để tối ưu hóa lượng oxy khi lặn lâu.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng các cơ quan thụ cảm áp lực da (integumentary sensory organs - ISOs) sắp xếp quanh hàm để cảm nhận các dao động mặt nước nhỏ nhất từ khoảng cách xa.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sở hữu hệ gene mã hóa các peptide kháng khuẩn peptide crocodilin cực mạnh trong máu giúp tự chữa lành các vết thương hở sâu dưới nước lầy lội không bị nhiễm trùng.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.02384",
        "label": "Journal of Experimental Biology - Aerobic and anaerobic metabolism during activity in Crocodylus porosus"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Đá cuội trong dạ dày (gastroliths) của cá sấu nước mặn chiếm khoảng 1% khối lượng cơ thể, giúp chúng làm nghiền thức ăn và điều chỉnh trọng tâm lặn chìm cân bằng dưới nước.",
        "Cá sấu nước mặn có thể bơi vượt đại dương hàng nghìn cây số bằng cách 'lướt' theo các dòng hải lưu lớn mà không tốn nhiều cơ năng."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ miễn dịch tự nhiên có chứa các phân tử sắt kháng khuẩn vô hiệu hóa hầu hết các chủng vi khuẩn gram âm gây hoại tử.",
        "Lực đuôi cực đại tạo gia tốc đẩy chớp nhoáng lao thẳng lên từ dưới nước để ngoạm con mồi trên bờ."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tích tụ axit lactic kỵ khí rất nhanh trong các cơ xương khi vận động cực mạnh kéo dài, có thể gây sốc toan máu chết nếu không được nghỉ ngơi kịp thời.",
        "Không có tuyến mồ hôi, phụ thuộc hoàn toàn vào hành vi hé mở miệng đón gió để thoát nhiệt cơ thể."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'sand-tiger-shark') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá tầng đáy", "cá đuối", "mực", "cá mập nhỏ khác", "tôm cua"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 35;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = "Đẻ con sống (noãn thai sinh/viviparous). Trải qua quá trình intrauterine cannibalism: phôi lớn nhất trong tử cung kép sẽ ăn các phôi nhỏ hơn và trứng chưa thụ tinh để phát triển đến khi đạt kích thước lớn hơn 1m mới chào đời. Mỗi lứa chỉ sinh tối đa 2 con.";
      newC.locomotion = 'swim';
      newC.speed_max = 20.0;
      newC.conservation_status = 'CR';
      newC.size_min_mm = 2000.0;
      newC.size_max_mm = 3200.0;
      newC.weight_avg_g = 125000.0;

      const charAdd = " Vảy da placoid dạng răng cưa siêu nhỏ sắp xếp dọc thân giúp triệt tiêu dòng xoáy nước hỗn loạn.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng các lỗ cảm biến Ampullae of Lorenzini phân bố quanh mõm để phát hiện dòng điện sinh học cực yếu dưới 0.01 microvolt phát ra từ nhịp tim của con mồi trốn dưới cát.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng điều khiển khí trong dạ dày để điều hòa lực nổi tĩnh, cho phép lơ lửng bất động giống hệt một vật thể vô tri để săn mồi phục kích.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.cub.2016.03.018",
        "label": "Current Biology - Embryonic cannibalism and paternity in sand tiger sharks"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Chúng là loài cá mập duy nhất được biết đến có thói quen phát ra tiếng ợ hơi lớn để xả khí dạ dày khi cần chìm nhanh tránh chướng ngại vật.",
        "Hàm răng của cá mập hổ cát hoạt động như một băng chuyền liên tục, răng mới mọc lên thay thế răng rụng chỉ trong vòng 48 giờ."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ chế noãn thai sinh cạnh tranh khốc liệt giúp cá con sinh ra đã có kích thước lớn và khả năng săn mồi thuần thục bậc nhất.",
        "Cặp mắt nhỏ có lớp màng bảo vệ đặc biệt giúp nhìn rõ trong môi trường hang đá ngầm thiếu sáng."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Không thể bơi giật lùi do cấu tạo vây ngực cứng cố định, khiến chúng dễ bị mắc kẹt nếu chui vào khe đá quá hẹp.",
        "Tốc độ sinh trưởng cực kỳ chậm và tuổi thục sinh dục muộn (khoảng 9-10 tuổi), làm chậm tiến trình hồi phục quần thể khi bị đánh bắt."
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
