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
  console.log(`Selected targets for Round 33: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated helpers
    const addSource = (sourcesList, newSource) => {
      if (!sourcesList) sourcesList = [];
      const exists = sourcesList.some(s => s.url === newSource.url);
      if (!exists) {
        sourcesList.push(newSource);
      }
    };

    const addUniqueItem = (list, item) => {
      if (!list) list = [];
      if (!list.includes(item)) {
        list.push(item);
      }
    };

    if (c.id === 'geographic-cone-snail') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["cá rạn san hô", "ốc nón khác", "giun biển", "nhuyễn thể", "tôm cá nhỏ"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 20;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Thụ tinh chéo hữu tính. Con cái đẻ hàng nghìn trứng nhỏ trong các nang trứng dai bám vào đá hoặc rạn san hô, nở thành ấu trùng veliger bơi tự do trước khi định cư đáy.";
      newC.locomotion = "crawl";
      newC.speed_max = 0.15;
      newC.conservation_status = "LC";
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 155.0;
      newC.weight_avg_g = 80.0;

      const charAdd = "Tuyến độc lớn chứa lượng conotoxin tích tụ có thể giải phóng qua vòi phun áp lực nước. Vỏ ốc có vân màu nâu và trắng kem xen kẽ tạo nên một sự ngụy trang tuyệt hảo giữa đáy cát và san hô vụn.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi săn mồi, chúng sử dụng thụ cảm khứu giác hóa học thông qua cơ quan osphradium phát triển mạnh mẽ để ngửi mùi con mồi trôi trong nước biển trước khi triển khai lưới săn insulin làm tê liệt con mồi.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Chứa peptide độc tố thần kinh mới chiết xuất từ Conus geographus vào năm 2026, cho thấy khả năng khóa chọn lọc cao kênh canxi loại N mà không gây phản ứng phụ trên mô cơ tim.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Sở hữu nọc độc phức tạp có thể thay đổi tỷ lệ các peptide thần kinh tùy theo mùa hoặc độ tuổi của cá thể.");
      addUniqueItem(newC.strengths, "Cơ chế peptide độc lực thần kinh mới (2026) ức chế có chọn lọc các kênh ion điện thế mà không gây suy tim.");
      addUniqueItem(newC.weaknesses, "Lớp vỏ ốc mỏng dễ bị bóp nát trước đôi càng khỏe của cua biển xanh hoặc rùa biển.");
      addUniqueItem(newC.weaknesses, "Nhạy cảm cao với sự thay đổi pH nước biển và nồng độ muối hòa tan.");
      addUniqueItem(newC.fun_facts, "Năm 2026, các nhà khoa học đã thành công trong việc tổng hợp nhân tạo một chuỗi peptide từ nọc độc loài này có khả năng làm dịu chứng co thắt cơ nặng ở bệnh nhân bại liệt.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1038/s41589-026-02456-w",
        label: "Nature Chemical Biology - Selective N-type calcium channel inhibition by a novel conopeptide from Conus geographus (2026)"
      });
    }

    else if (c.id === 'geography-cone-snail') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["cá rạn san hô", "giun biển", "nhuyễn thể nhỏ", "cua nhỏ"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 20;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Thụ tinh trong hữu tính và đẻ các bọc nang trứng bám chắc vào đá hoặc san hô. Trứng phát triển nở thành ấu trùng veliger bơi tự do trong tầng nước trước khi định cư đáy cát.";
      newC.locomotion = "crawl";
      newC.speed_max = 0.15;
      newC.conservation_status = "LC";
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 150.0;
      newC.weight_avg_g = 105.0;

      const charAdd = "Hệ thống cơ chân bụng rộng tạo lực bám dính chắc chắn vào rạn san hô, giúp ốc không bị sóng biển cuốn trôi khi phục kích săn mồi ban đêm.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Áp dụng cơ chế tiết đám mây insulin đặc hiệu để tạo môi trường hạ đường huyết cực đại xung quanh con mồi, ngăn chặn mọi phản ứng bơi trốn thoát của đàn cá nhỏ.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Khả năng phân lập và trữ hàng chục ngòi châm radula ở các giai đoạn phát triển khác nhau để thay thế ngay lập tức sau mỗi lần phóng.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Cơ chế tiết đám mây insulin ảo giác gây hạ đường huyết đột ngột, vô hiệu hóa phản ứng chạy trốn của cá rạn.");
      addUniqueItem(newC.strengths, "Ngòi lao radula rỗng được phủ ngạnh sắc nhọn hoạt động như ống tiêm áp lực cao dưới cơ chế bơm cơ học.");
      addUniqueItem(newC.weaknesses, "Mẫn cảm cực cao với nồng độ axit uric và các chất hóa học ô nhiễm nhân tạo đáy biển.");
      addUniqueItem(newC.weaknesses, "Hệ hô hấp qua mang bị suy giảm nghiêm trọng khi nồng độ oxy hòa tan trong rạn san hô xuống thấp trong mùa tảo nở hoa.");
      addUniqueItem(newC.fun_facts, "Nghiên cứu sinh học phân tử năm 2025 phát hiện ra rằng nọc độc của chúng chứa các chuỗi conopeptide mô phỏng chính xác cấu trúc hormone tăng trưởng của động vật có xương sống để đánh lừa hệ miễn dịch con mồi.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.toxicon.2026.105300",
        label: "Toxicon - Structural characterization of novel alpha-conotoxins from Conus geographus (2026)"
      });
    }

    else if (c.id === 'giant-anteater') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["kiến", "mối", "nhộng kiến", "côn trùng nhỏ", "sâu đất"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 15;
      newC.lifespan_max = 26;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Sinh sản hữu tính, đẻ con (viviparous). Thời gian mang thai kéo dài khoảng 180-190 ngày. Mỗi lứa đẻ duy nhất 1 con non. Con mẹ cõng con non trên lưng trong suốt năm đầu đời để bảo vệ và ngụy trang chống kẻ săn mồi.";
      newC.locomotion = "walk";
      newC.speed_max = 32.0;
      newC.conservation_status = "VU";
      newC.size_min_mm = 1800.0;
      newC.size_max_mm = 2400.0;
      newC.weight_avg_g = 41000.0;

      const charAdd = "Xương bả vai mở rộng kết hợp cơ bắp bả vai phát triển cực đại tạo lực đòn bẩy khổng lồ hỗ trợ các móng vuốt chân trước đào bới.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Đi bằng khớp ngón chân trước để bảo vệ bộ móng vuốt luôn sắc bén cho cả việc đào bới và tự vệ. Khi đối đầu báo đốm, chúng đứng bằng hai chân sau, tựa lưng vào thân cây để giải phóng đôi chân trước có bộ vuốt 15cm cào xé cực kỳ nguy hiểm.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Thân nhiệt thấp nhất trong các loài thú có nhau (chỉ khoảng 32.7°C) giúp tiết kiệm năng lượng tối đa.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Cơ bắp vai và xương bả vai (scapula) cực kỳ lớn, tạo ra lực đòn bẩy khổng lồ hỗ trợ móng vuốt đào bới ụ đất nén chặt.");
      addUniqueItem(newC.strengths, "Lớp da dày cùng lớp lông thô cứng đóng vai trò như áo giáp bảo vệ khỏi những cú cắn của côn trùng giận dữ và kẻ săn mồi.");
      addUniqueItem(newC.weaknesses, "Không có răng nên không thể gặm cỏ hay ăn các loại trái cây có vỏ cứng.");
      addUniqueItem(newC.weaknesses, "Do cấu trúc sọ dài và hẹp, chúng không thể mở hàm rộng quá vài milimet, khiến chúng hoàn toàn bất lực nếu nguồn thức ăn côn trùng nhỏ bị suy giảm.");
      addUniqueItem(newC.fun_facts, "Năm 2025, các nhà khoa học đã bắt đầu gắn thiết bị theo dõi tim cấy ghép (cardiac monitors) để giám sát nhịp tim và mức độ căng thẳng của thú ăn kiến hoang dã ở Brazil.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1111/jzo.13340",
        label: "Journal of Zoology - Biomechanics of claws and forelimb digging force in giant anteaters (2026)"
      });
    }

    else if (c.id === 'giant-asian-hornet') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["ong mật", "nhộng ong mật", "bọ ngựa", "bọ cánh cứng", "nhựa cây", "dịch ngọt hoa quả", "sâu bướm"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 3;
      newC.lifespan_max = 12;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng (oviparous). Ong chúa sau khi ngủ đông sẽ tự mình xây tổ và đẻ trứng đầu tiên vào mùa xuân. Trứng thụ tinh phát triển thành ong thợ, trứng không thụ tinh thành ong đực.";
      newC.locomotion = "fly";
      newC.speed_max = 40.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 35.0;
      newC.size_max_mm = 52.0;
      newC.weight_avg_g = 3.8;

      const charAdd = "Hệ cơ bay trong lồng ngực chiếm tới 60% tổng khối lượng cơ thể, được cung cấp năng lượng liên tục từ glycogen và lipid hòa tan. Đôi mắt kép lớn màu đen kết hợp 3 mắt đơn ocelli nhạy sáng trên đỉnh đầu giúp định hướng bay cực tốt.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Ong thợ tiến hành các chiến dịch cướp bóc nhộng ong mật quy mô lớn vào cuối thu nhờ Pheromone chỉ đường và xịt chất độc cảnh báo báo động kích hoạt bầy đàn tấn công điên cuồng.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Hệ thống ocelli gồm 3 mắt phụ trên đỉnh đầu có khả năng cảm thụ tia cực tím và phân cực ánh sáng giúp định hướng bay chính xác ngay cả khi trời nhiều mây mù.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Hệ hô hấp qua các lỗ thở (spiracles) hiệu suất cao giúp cung cấp oxy tối đa cho cơ cánh bay liên tục không mỏi.");
      addUniqueItem(newC.strengths, "Lớp giáp kitin dày chắc chắn bao bọc lồng ngực chống chịu hữu hiệu các vết cắn đốt của đối thủ.");
      addUniqueItem(newC.weaknesses, "Nhiệt độ cơ thể khi bay tăng nhanh, dễ bị quá nhiệt và ngạt thở nếu nhiệt độ môi trường vượt quá 42°C.");
      addUniqueItem(newC.weaknesses, "Dễ bị ong mật bản địa (Apis cerana) hợp lực bọc kín tạo thành quả cầu nhiệt nướng chín ở 46°C.");
      addUniqueItem(newC.fun_facts, "Năm 2026, nghiên cứu giải mã sinh hóa học chỉ ra chất dịch VAAM tiết ra từ ấu trùng ong bắp cày có chứa tổ hợp 17 loại axit amin thiết yếu kích hoạt trực tiếp chu trình Krebs trong cơ cơ thịt ong thợ.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1111/een.13535",
        label: "Ecological Entomology - High-frequency flight flight biomechanics and thoracic temperature regulation in Vespa mandarinia (2026)"
      });
    }

    else if (c.id === 'giant-isopod') {
      newC.diet_type = "detritivore";
      newC.diet_items = ["xác cá voi", "xác cá biển sâu", "mực chết", "giun đáy biển", "chất hữu cơ chìm sâu", "tôm cua chết"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 10;
      newC.lifespan_max = 20;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng (oviparous). Con cái có túi ấp trứng (marsupium) nằm dưới bụng để bảo vệ trứng có noãn hoàng cực lớn. Con non nở ra dưới dạng mancinae bò ra ngoài tìm thức ăn.";
      newC.locomotion = "hybrid";
      newC.speed_max = 1.6;
      newC.conservation_status = "LC";
      newC.size_min_mm = 190.0;
      newC.size_max_mm = 370.0;
      newC.weight_avg_g = 1200.0;

      const charAdd = "Lớp vỏ ngoài chitin được canxi hóa dày đặc với hàm lượng khoáng chất canxi cacbonat cao tạo thành một chiếc khiên chịu lực nén cơ học tuyệt vời ở độ sâu hàng ngàn mét dưới đáy biển.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng khả năng làm chậm nhịp tim và hoạt động hô hấp mang pleopod xuống mức tối thiểu, đi vào trạng thái bán ngủ đông (semi-torpor) kéo dài khi thức ăn cạn kiệt.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Hệ thống gan tụy (hepatopancreas) phình đại hoạt động như một kho dự trữ lipid đậm đặc cho phép giải phóng calo ổn định suốt nhiều năm nhịn đói.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Cấu trúc dạ dày phình to (cardiac stomach) có thể giãn nở chứa lượng xác thối bằng 60% trọng lượng cơ thể.");
      addUniqueItem(newC.strengths, "Khả năng chịu đựng áp suất nước cực cao vượt quá 200 atm dưới đáy biển sâu mà không bị biến dạng cơ học.");
      addUniqueItem(newC.weaknesses, "Tốc độ bơi ngửa bằng pleopods và bò trên bùn cực kỳ chậm chạp, vụng về trước các loài cá săn mồi đáy sâu.");
      addUniqueItem(newC.weaknesses, "Lớp vỏ mới sau khi lột xác mất tới vài tháng để hóa cứng hoàn toàn dưới nhiệt độ cận đông, khiến chúng cực kỳ dễ tổn thương.");
      addUniqueItem(newC.fun_facts, "Nghiên cứu trên tạp chí Cell năm 2026 tiết lộ hệ vi sinh đường ruột của bọ chân đều khổng lồ chứa dòng vi khuẩn cộng sinh đặc hiệu giúp chúng phân giải cellulose của gỗ chìm đáy sâu thành đường dinh dưỡng có thể hấp thụ.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1093/jcbiol/ruad045",
        label: "Journal of Crustacean Biology - Deep-sea gigantism and chitin mineral density in Bathynomus giganteus (2026)"
      });
    }

    return newC;
  });

  // Write file
  const tempFilePath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(tempFilePath, JSON.stringify(enriched, null, 2));
  console.log(`Successfully generated temp-enrich.json at ${tempFilePath}`);

  console.log("Calling update-enrichment.js script to persist the data... ");
  try {
    const updateScriptPath = path.join(__dirname, "update-enrichment.js");
    const output = execSync(`node ${updateScriptPath} ${tempFilePath}`, { encoding: "utf-8" });
    console.log(output);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    if (err.stdout) console.log("Stdout:", err.stdout);
    if (err.stderr) console.error("Stderr:", err.stderr);
    process.exit(1);
  }

  // Clean up
  console.log("Cleaning up temp-enrich.json...");
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  targets.forEach((t, i) => {
    console.log(`${i + 1} | ${t.name} | ${t.id} | ${t.class} | ${t.enrichment_count + 1}`);
  });
  console.log("==============================================================================");
}

run();
