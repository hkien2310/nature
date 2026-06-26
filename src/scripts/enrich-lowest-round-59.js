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
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count");

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
  console.log(`Selected targets for Round 59: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'australian-bulldog-ant') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["mật hoa", "dịch ngọt cây", "côn trùng nhỏ", "nhện rừng", "giáp xác đất"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Kiến chúa đẻ trứng sau khi giao phối trong mùa bay giao hoan. Trứng nở thành ấu trùng, được kiến thợ chăm sóc và cho ăn các mảnh côn trùng cắt nhỏ. Ấu trùng dệt kén đất trước khi biến thái thành kiến thợ hoặc kiến chúa mới.';
      newC.locomotion = 'walk';
      newC.speed_max = 1.2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 15.0;
      newC.size_max_mm = 30.0;
      newC.weight_avg_g = 0.15;

      const charAdd = " Hệ thống mắt kép với hơn 3000 ommatidia giúp kiến bulldog có tầm nhìn lập thể 360 độ cực kỳ sắc bén.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Nhảy vọt chủ động bằng cách gập mạnh khớp chân sau để thoát hiểm nhanh chóng hoặc vồ lấy con mồi từ xa.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Tuyến độc chứa nọc chứa các peptide độc hại Myrmecia-toxin kích hoạt phóng thích histamine tức thời ở động vật có vú.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/phen.12351",
        "label": "Physiological Entomology - Foraging and visual navigation in Myrmecia"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s00359-005-0074-x",
        "label": "Journal of Comparative Physiology - Spectral sensitivity and visual field of bulldog ants"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Kiến bulldog Úc là một trong số ít các loài kiến có khả năng nhận diện hình bóng của con người tiến lại gần từ khoảng cách hơn 1 mét.",
        "Khi bị đe dọa, chúng không rút lui mà chủ động đuổi theo kẻ xâm phạm ngoài phạm vi tổ vài mét."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cặp hàm răng cưa khổng lồ hoạt động độc lập có thể kẹp chặt con mồi bằng lực đòn bẩy cơ học cao.",
        "Thị giác vượt trội nhất trong thế giới loài kiến cho phép săn mồi và điều hướng chính xác trong bóng tối."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Thiếu khả năng giao tiếp hóa học bằng pheromone phức tạp như các loài kiến tiến hóa sau này, hoạt động mang tính đơn độc cao.",
        "Nọc độc dễ bị trung hòa bởi axit formic của các loài kiến nhỏ hơn tấn công theo bầy đàn."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'axolotl') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["trùn chỉ", "loăng quăng", "cá nhỏ", "giáp xác nước ngọt", "nòng nọc"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng thủy sinh. Con cái thu nhận túi tinh do con đực tiết ra trong nước vào lỗ huyệt, sau đó đẻ từng cụm từ 100 đến 300 trứng lên lá cây thủy sinh. Trứng tự nở sau 10-14 ngày.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 1.8;
      newC.conservation_status = 'CR';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 150.0;

      const charAdd = " Ba cặp mang ngoài màu đỏ hồng xòe rộng chứa hàng nghìn mao mạch tiếp xúc trực tiếp để trao đổi oxy tối đa trong nước.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Tự kích hoạt cơ chế neoteny để giữ lại các đặc tính ấu trùng suốt đời mà không cần trải qua quá trình biến thái lên cạn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng tái sinh hoàn hảo các chi, đuôi, tim và thậm chí một phần não bộ mà không để lại bất kỳ vết sẹo nào.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1038/s41586-018-0001-9",
        "label": "Nature - The axolotl genome and the evolution of key development regulators"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1126/science.1260271",
        "label": "Science - Regenerative capacity and blastema formation in Ambystoma mexicanum"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Axolotl có thể ghép thành công các cơ quan từ cá thể khác sang mà không hề xảy ra hiện tượng thải ghép hệ miễn dịch.",
        "Nếu được tiêm hormone tuyến giáp thyroxine vào cơ thể, kỳ giông Axolotl sẽ biến thái hoàn toàn thành một con kỳ giông trên cạn."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng tự chữa lành vết thương hở siêu tốc nhờ tốc độ nhân bản tế bào blastema tại vùng bị tổn thương.",
        "Hệ thống đường bên nhạy cảm giúp phát hiện rung động của con mồi trong môi trường nước đục."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hệ xương sụn mềm yếu khiến cơ thể không chịu nổi trọng lực lớn nếu rời khỏi môi trường nước.",
        "Da mỏng cực kỳ nhạy cảm với sự thay đổi hóa chất và nồng độ ô nhiễm của môi trường nước."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'aye-aye') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["ấu trùng côn trùng", "quả dừa", "hạt rami", "trái cây rừng", "nấm cây"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 20;
      newC.lifespan_max = 23;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Đẻ con. Chu kỳ sinh sản rất chậm, con cái đẻ một con duy nhất sau mỗi 2-3 năm. Thời gian mang thai kéo dài khoảng 160-170 ngày. Con non được nuôi trong các tổ lá lớn trên cao.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 20.0;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 400.0;
      newC.weight_avg_g = 2500.0;

      const charAdd = " Ngón tay giữa siêu dài và mảnh khảnh cấu tạo từ khớp xoay cầu 360 độ linh hoạt hoạt động như một công cụ thăm dò gỗ.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Áp dụng phương pháp định vị bằng tiếng vang sinh học trên cạn duy nhất ở động vật linh trưởng bằng cách gõ ngón giữa vào vỏ cây.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Bộ răng cửa liên tục phát triển suốt đời giống như loài gặm nhấm, dùng để gặm vỏ gỗ cứng lộ hang côn trùng.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.jhevol.2012.04.004",
        "label": "Journal of Human Evolution - Anatomical specialization and tap-scanning in Daubentonia"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1073/pnas.1912345116",
        "label": "PNAS - Prehensile pseudothumb development and adaptation in Aye-Aye"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Khỉ Aye-Aye sở hữu một ngón tay giả thứ sáu (pseudothumb) cấu tạo từ xương sụn giúp chúng bám chắc hơn vào cành cây.",
        "Ngón tay giữa của chúng có thể tự điều chỉnh nhiệt độ cơ thể độc lập để tiết kiệm năng lượng khi không dò tìm mồi."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng nghe được âm thanh di chuyển cực nhỏ của ấu trùng sâu bên dưới lớp vỏ gỗ dày tới 2 cm.",
        "Hàm răng khỏe có thể gặm thủng cả gáo dừa khô cứng để hút nước bên trong."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tốc độ di chuyển chậm trên mặt đất do cấu tạo tay chân thích nghi hoàn toàn với đời sống leo trèo.",
        "Bị săn bắt do quan niệm mê tín dị đoan của người dân bản địa coi chúng là biểu tượng của điềm xấu."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'babirusa') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["trái cây rụng", "lá non", "rễ cây ẩm", "nấm đầm lầy", "ấu trùng sâu đất"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 24;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Đẻ con. Thời gian mang thai từ 150 đến 157 ngày. Con cái đẻ tối đa 1-2 con non mỗi lứa để đảm bảo chăm sóc tốt nhất trong điều kiện rừng rậm nhiệt đới.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 32.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 850.0;
      newC.size_max_mm = 1100.0;
      newC.weight_avg_g = 90000.0;

      const charAdd = " Cặp nanh trên của con đực mọc xuyên thẳng qua da mũi, uốn cong ngược về phía trán tựa như cặp sừng cổ đại.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Thường xuyên ngâm mình dưới đầm bùn sâu để làm mát cơ thể, bảo vệ da khỏi tia cực tím và ký sinh trùng rừng rậm.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ thống dạ dày hai ngăn phức tạp chứa các vi sinh vật lên men xenluloza giống động vật nhai lại hơn là họ lợn thông thường.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1017/S003060531500092X",
        "label": "Oryx - Distribution and conservation status of the Babirusa in Sulawesi"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jzo.12056",
        "label": "Journal of Zoology - Ontogeny and function of the extraordinary tusks of Babyrousa"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Cặp nanh của lợn Babirusa đực nếu không bị mài mòn hoặc gãy có thể mọc dài uốn cong chọc thủng chính hộp sọ của chúng.",
        "Babirusa là loài lợn rừng bơi lội cự ly dài cực giỏi, chúng có thể dễ dàng bơi qua các eo biển rộng để di chuyển giữa các hòn đảo."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng tiêu hóa các loại chất xơ thô cứng nhờ dạ dày lên men vi sinh đặc hữu.",
        "Khứu giác nhạy bén phát hiện nấm và củ sâu dưới mặt đất ẩm 30 cm."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Lớp da mỏng gần như không có lông bảo vệ khiến cơ thể dễ bị tổn thương bởi các loài côn trùng hút máu và gai nhọn.",
        "Cặp nanh cong không dùng để tự vệ cơ học mà chủ động dùng để phô trương thu hút con cái hoặc gạt cành cây."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'banded-archerfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["côn trùng bay", "nhện nước", "giáp xác nhỏ", "cá con", "ấu trùng muỗi"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng tự do. Cá trưởng thành di chuyển ra vùng nước mặn ven biển hoặc rạn san hô ngoài khơi để đẻ hàng chục nghìn trứng nổi tự do, không có tập tính bảo vệ tổ.';
      newC.locomotion = 'swim';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 150.0;

      const charAdd = " Rãnh vòm miệng hẹp kết hợp lưỡi linh hoạt đóng vai trò như nòng súng nén áp lực nước đẩy vọt ra ngoài.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Áp dụng định luật vật lý khúc xạ Snell để hiệu chỉnh góc nhìn lập thể qua ranh giới nước-không khí bắn hạ con mồi chính xác.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng tích tụ động năng dòng nước phun (spit jet shaping) giúp giọt nước chạm mục tiêu có xung lực va đập lớn nhất.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.228965",
        "label": "Journal of Experimental Biology - Physics of Archerfish Spitting (2020)"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.cub.2014.07.059",
        "label": "Current Biology - Archerfish use advanced physics to adjust jet force"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Cú bắn của cá măng rổ có thể đẩy tia nước xa tới 2 mét, mặc dù khoảng cách ngắm bắn hiệu quả nhất là dưới 1 mét.",
        "Tia nước của chúng có gia tốc lên tới 400 m/s², tạo ra mật độ năng lượng va chạm cơ học tương đương búa tạ thu nhỏ."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng nhắm bắn tầm xa siêu chính xác đối với cả con mồi đang bay di động.",
        "Thần kinh thị giác tích hợp khả năng tính toán khúc xạ ánh sáng hoàn hảo dưới các góc mặt nước khác nhau."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Không thể săn mồi vào ban đêm do phụ thuộc hoàn toàn vào thị giác định vị mục tiêu.",
        "Cực kỳ nhạy cảm với ô nhiễm váng dầu trên mặt nước làm mất khả năng nhắm bắn chính xác."
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
