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
  console.log(`Selected targets for Round 21: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'arapaima') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nhỏ", "giáp xác", "côn trùng", "chim nhỏ", "động vật gặm nhấm", "ếch nhái"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng. Trong mùa khô (tháng 2 đến tháng 4), chúng đào tổ sâu khoảng 15cm, rộng 50cm trên nền cát/bùn. Trứng được cá đực bảo vệ trong miệng (mouthbrooding) hoặc dẫn đàn bằng dịch tiết mang hương trên đầu.";
      newC.locomotion = 'swim';
      newC.speed_max = 35.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 2000.0;
      newC.size_max_mm = 4500.0;
      newC.weight_avg_g = 200000.0;

      const charAdd = "Lớp vỏ ngoài của vảy chứa tỷ lệ hydroxyapatite thấp nhưng được gia cố chéo cơ học cực cao bởi các thớ collagen Bouligand mềm mại phía dưới.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Trong điều kiện khô hạn dòng nước cạn, arapaima cuộn mình trong vũng bùn ẩm và ngoi lên đớp khí liên tục để sinh tồn qua mùa khô.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sự kết hợp hoàn hảo giữa gốm sinh học siêu cứng và polymer collagen đàn hồi tự nhiên tạo nên cấu trúc giáp chống đâm thủng tối tân nhất thế giới tự nhiên.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.actbio.2018.06.012",
        "label": "Acta Biomaterialia - Deformation and failure mechanisms of Arapaima gigas scales"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Bóng cá của Arapaima chiếm tới 80% thể tích khoang cơ thể, đóng vai trò như một lá phổi giả lập khổng lồ giúp chúng thở trực tiếp khí trời.",
        "Khi cá bố bơi đi, đàn con hàng nghìn con bơi quây quần xung quanh đầu cá bố nhờ pheromone tiết ra từ các tuyến da đặc biệt."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng hấp thụ xung lực tuyệt đối từ va đập cơ học nhờ lớp đệm collagen Bouligand ngậm nước."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tần suất nổi lên thở cố định sau mỗi 10-20 phút khiến chúng trở thành mục tiêu cực kỳ dễ đoán đối với các ngư dân săn bắn."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'archerfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["nhện", "ruồi", "muỗi", "châu chấu", "bướm", "giáp xác nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 2;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính, thụ tinh ngoài. Con cái đẻ từ 20.000 đến 150.000 trứng nổi trên mặt nước. Trứng nở thành cá con sau khoảng 12-20 giờ dưới sự bảo vệ của môi trường rừng ngập mặn.";
      newC.locomotion = 'swim';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 120.0;
      newC.size_max_mm = 200.0;
      newC.weight_avg_g = 180.0;

      const charAdd = "Lưỡi của chúng có khả năng co giãn linh hoạt để tạo thành van một chiều bịt kín rãnh khẩu cái khi ép mang đẩy tia nước.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khả năng định vị nhanh vị trí rơi của con mồi dựa trên góc phun nước giúp chúng luôn đi trước một bước so với các loài cá cạnh tranh khác.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Não bộ của cá cung thủ thực hiện tính toán các biến số khúc xạ ánh sáng Snell chỉ trong vòng vài mili giây mà không cần phản hồi thử-sai.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.080598",
        "label": "Journal of Experimental Biology - Hydrodynamics of archerfish spitting"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Tia nước của cá cung thủ được điều chỉnh tốc độ phun để phần đuôi luôn đập mạnh vào phần đầu tạo giọt đạn nước nén cực đại.",
        "Cá cung thủ có thể phân biệt được các mẫu hình chấm tròn khác nhau để phun tia nước chính xác vào mục tiêu ảo."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Kỹ năng khuếch đại lực cơ học ngoài cơ thể thông qua gia tốc tia nước trong không khí."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Độ chính xác của tia nước giảm đáng kể khi độ cao mục tiêu vượt quá 1.5 mét."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'argentine-horned-frog') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["chuột", "thằn lằn", "ếch nhỏ", "côn trùng lớn", "chim non", "rắn nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng. Sau những trận mưa lớn vào mùa xuân, con cái đẻ tới 1.000 đến 2.000 trứng trực tiếp vào các vũng nước ngập tạm thời. Trứng bám vào thực vật thủy sinh và nở nhanh sau 24 giờ.";
      newC.locomotion = 'crawl';
      newC.speed_max = 2.5;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 90.0;
      newC.size_max_mm = 165.0;
      newC.weight_avg_g = 450.0;

      const charAdd = "Lớp sụn mút và hệ xương vai ngắn tạo điều kiện truyền trực tiếp 100% lực cản cơ học từ cú táp lên sọ mà không làm tổn thương khớp.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Rơi vào trạng thái đình sinh (estivation) ngủ hè trong các kén da sinh học tự sản sinh khi đất cằn mất ẩm mùa khô.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Tế bào cơ cắn hàm sở hữu mật độ ti thể và sợi miozin siêu dày giúp duy trì áp lực táp liên tục không mỏi.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.228189",
        "label": "Journal of Experimental Biology - Horned frog jaw-adductor muscle performance"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Ếch sừng có thể nuốt các con rắn độc mà không hề hấn gì nhờ lượng axit hydrochloric đậm đặc trong dịch dạ dày phân giải độc tố nhanh chóng.",
        "Nòng nọc của loài này có thể chủ động phát ra âm thanh click kim loại để xua đuổi các con nòng nọc khác bơi xa."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hộp sọ cốt hóa liền khối chịu được lực phản chấn cực đại từ con mồi khỏe."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tính tham ăn tột cùng đôi khi khiến chúng bị nghẹt thở chết vì cố nuốt những con chuột cống quá to."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'army-ant') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["nhện", "côn trùng", "bọ cạp", "thằn lằn nhỏ", "chim con", "ếch nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính. Kiến chúa thụ tinh một lần và lưu trữ tinh trùng suốt đời, đẻ hàng triệu trứng theo chu kỳ định sẵn. Đàn kiến lính và thợ bảo vệ trứng và ấu trùng trong tổ bivouac sống.";
      newC.locomotion = 'walk';
      newC.speed_max = 0.2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 3.0;
      newC.size_max_mm = 25.0;
      newC.weight_avg_g = 0.02;

      const charAdd = "Hệ thống cơ thắt lưng phát triển các khớp cơ liên kết đàn hồi chịu lực căng kéo cực đại.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Thiết lập các cầu nối cơ thể sống tự động co giãn dựa trên mật độ lưu thông của đàn hành quân.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Mạng lưới liên kết sống bivouac của hàng triệu con kiến thợ có thể tự điều hòa nhiệt độ ổn định ở 28 độ C.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1073/pnas.1512241112",
        "label": "PNAS - Self-assembled bridges in army ants"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Người bản địa Amazon đôi khi sử dụng hàm kẹp của kiến quân đội lính như các mũi khâu da vết thương tự nhiên vô trùng.",
        "Một đàn kiến quân đội có thể di chuyển và tàn sát hơn 500.000 con mồi nhỏ mỗi ngày trong rừng nhiệt đới."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Trí tuệ bầy đàn phi tập trung phân bổ lực liên kết bắc cầu cơ học hoàn hảo."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Rất nhạy cảm với việc bị mất dấu vết pheromone mùi hương hành quân dẫn đến hiện tượng vòng tròn tử thần."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'asian-water-monitor') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá", "cua", "chim", "trứng", "xác thối", "động vật gặm nhấm", "rắn"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng. Con cái đẻ từ 10 đến 40 quả trứng vào hốc cây mục, hang đất bên bờ sông hoặc đống đổ nát. Trứng được ấp thụ động nhờ nhiệt độ phân hủy chất hữu cơ và nở sau 6-9 tháng.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 25.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1500.0;
      newC.size_max_mm = 3000.0;
      newC.weight_avg_g = 19580.0;

      const charAdd = "Tuyến dưới hàm tiết dịch chứa các protein chống đông máu và gây hạ huyết áp cục bộ ở con mồi.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khả năng bơi lặn vượt đại dương và thích nghi cao với các khu vực ô nhiễm đô thị chứa đầy kim loại nặng.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Bộ gen sở hữu nhóm gen tự miễn miễn dịch bẩm sinh cực mạnh, bảo vệ vết thương hở khỏi nhiễm trùng trong bùn bẩn.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1186/s12864-020-07106-0",
        "label": "BMC Genomics - Innate immune adaptations of Varanus salvator"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Kỳ đà nước châu Á có lưỡi chẻ đôi dài nhô ra thu thập phân tử mùi trong không khí tương tự như lưỡi rắn.",
        "Chúng có thể lặn dưới nước liên tục suốt 30 phút mà không cần ngoi lên lấy dưỡng khí nhờ nhịp tim giảm sâu."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Kháng thể sinh học tự nhiên vô hiệu hóa hầu hết các loại vi khuẩn nguy hiểm trong thức ăn xác thối phân hủy."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cơ chế điều nhiệt phụ thuộc hoàn toàn vào môi trường (biến nhiệt) khiến chúng chậm chạp trong những ngày nhiều mây."
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
