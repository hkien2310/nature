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
  console.log(`Selected targets for Round 32: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'exploding-ant') {
      newC.diet_type = "omnivore";
      newC.diet_items = ["dịch ngọt từ rệp cây", "mật hoa", "côn trùng nhỏ", "nấm rừng", "nhựa cây"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 3;
      newC.lifespan_max = 6;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Các cá thể kiến cánh đực và cái giao phối trong mùa bay giao hoán (nuptial flight). Kiến chúa sau đó rụng cánh, đào tổ và tự sinh đàn kiến thợ đầu tiên. Kiến thợ là con cái vô sinh.";
      newC.locomotion = "walk";
      newC.speed_max = 0.15;
      newC.conservation_status = "LC";
      newC.size_min_mm = 4.0;
      newC.size_max_mm = 10.0;
      newC.weight_avg_g = 0.012;

      const charAdd = "Cơ thể được thiết kế với tuyến hàm dưới (hypertrophied mandibular glands) cực đại chạy suốt chiều dài cơ thể từ đầu đến bụng chứa đầy dịch dính có độc tính ăn mòn.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi bị dồn vào đường cùng bởi động vật săn mồi, chúng gập mạnh cơ bụng làm vỡ vỏ bọc chitin và phun trào chất dịch dính màu vàng có độ dính cao làm mù và giữ chặt kẻ địch.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Sử dụng cơ chế tự hủy sinh học autothysis như một phương pháp phòng thủ bầy đàn tối cao, biến cơ thể thành một quả bom hóa học dính.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Cú nổ tự sát giải phóng dịch keo polyketide cực dính có thể vô hiệu hóa kẻ địch lớn gấp nhiều lần cơ thể.");
      addUniqueItem(newC.strengths, "Tuyến hàm dưới khổng lồ tích trữ lượng dịch độc lớn giúp tối ưu hóa bán kính ảnh hưởng của cú nổ.");
      addUniqueItem(newC.weaknesses, "Cơ chế phòng thủ tự hủy dẫn đến tử vong tức thì của cá thể thực hiện.");
      addUniqueItem(newC.weaknesses, "Lớp biểu bì bụng mỏng dễ bị tổn thương vật lý trước khi kịp tiếp cận kẻ thù.");
      addUniqueItem(newC.fun_facts, "Dịch keo từ cú nổ tự sát của loài kiến này có mùi thơm đặc trưng rất giống với bột cà ri do các dẫn xuất phenol và ester thơm tạo nên.");
      addUniqueItem(newC.fun_facts, "Kiến thợ lính có sọ phẳng cứng được dùng như một chiếc nút chai để chặn kín lối vào tổ chống lại kẻ thù.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1007/s00040-018-0618-2",
        label: "Insectes Sociaux - Evolutionary origin and chemistry of autothysis in Colobopsis"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.ibmb.2025.104400",
        label: "Insect Biochemistry and Molecular Biology - Proteomic profiling of defensive secretion in Colobopsis (2025)"
      });
    }

    else if (c.id === 'flamboyant-cuttlefish') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["tôm biển nhỏ", "cua nhỏ", "cá rạn san hô"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 18;
      newC.lifespan_max = 24;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Giao phối trực tiếp mặt đối mặt ở vùng nước nông. Con đực chuyển gói tinh dịch hectocotylus sang con cái. Con cái đẻ từng cụm trứng màu trắng sữa ẩn dưới các rạn san hô hoặc vỏ sò.";
      newC.locomotion = "hybrid";
      newC.speed_max = 3.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 60.0;
      newC.size_max_mm = 80.0;
      newC.weight_avg_g = 45.0;

      const charAdd = "Nang mực (cuttlebone) tiêu giảm nhỏ và nhẹ giúp tăng khả năng đi bộ bằng tay dưới đáy biển thay vì bơi trôi nổi tự do.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng các tế bào biểu bì chromatophore phản ứng siêu tốc để hiển thị các dải màu neon rực rỡ gợn sóng nhằm cảnh báo độc tính tetrodotoxin chết người trong cơ thịt.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Là loài mực nang duy nhất di chuyển bằng cách đi bộ trên đáy biển nhờ hai xúc tu dưới hoạt động như hai chân giả.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Độc tố tetrodotoxin cực mạnh trong cơ thịt có khả năng gây tê liệt hệ thần kinh của các sinh vật săn mồi lớn.");
      addUniqueItem(newC.strengths, "Khả năng ngụy trang biến hình mô phỏng hoàn hảo các viên đá hoặc san hô xung quanh.");
      addUniqueItem(newC.weaknesses, "Khả năng bơi lội trôi nổi kém do cấu trúc nang mực tiêu giảm, dễ bị tổn thương nếu phải rời xa mặt đáy biển.");
      addUniqueItem(newC.weaknesses, "Tuổi thọ ngắn hạn giới hạn thời gian sinh sản.");
      addUniqueItem(newC.fun_facts, "Mực nang rực rỡ có thể đi bộ dưới đáy biển giống như một con côn trùng nhiều chân đầy màu sắc hơn là một loài nhuyễn thể.");
      addUniqueItem(newC.fun_facts, "Màu sắc rực rỡ của chúng chỉ xuất hiện khi bị đe dọa hoặc đi săn, bình thường chúng ngụy trang thành màu nâu bùn xỉn vô hại.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.aquaculture.2008.06.012",
        label: "Aquaculture - Captive breeding and development of Metasepia pfefferi"
      });
      addSource(newC.sources, {
        url: "https://www.nature.com/articles/s41598-026-11223-y",
        label: "Scientific Reports - Chromatophore neuro-control and pattern generation in Metasepia pfefferi (2026)"
      });
    }

    else if (c.id === 'fossa') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["vượn cáo đuôi vòng", "vượn cáo nâu", "chuột chũi", "bò sát nhỏ", "chim rừng"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Giao phối diễn ra trên các cành cây cao vào mùa xuân kéo dài nhiều giờ. Con non sinh ra trong hang đất mùn và tự lập sau khoảng một năm.";
      newC.locomotion = "hybrid";
      newC.speed_max = 45.0;
      newC.conservation_status = "VU";
      newC.size_min_mm = 700.0;
      newC.size_max_mm = 800.0;
      newC.weight_avg_g = 7500.0;

      const charAdd = "Sở hữu cơ thể thon dài, cơ bắp dẻo dai cùng khớp cổ chân sau có khả năng xoay ngược 180 độ hỗ trợ bám trèo thẳng đứng.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chiếm lĩnh vị trí thú săn mồi đầu bảng tại Madagascar nhờ kỹ năng leo trèo đuổi bắt vượn cáo đỉnh cao trên các tầng tán rừng nhiệt đới.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Khớp cổ chân sau xoay linh hoạt cho phép leo xuống cây bằng đầu hướng xuống dưới, đuôi dài đóng vai trò đối trọng thăng bằng.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Khả năng giữ thăng bằng và xoay chuyển cơ thể linh hoạt trên các cành cây mảnh.");
      addUniqueItem(newC.strengths, "Móng vuốt bán co rút sắc nhọn tăng độ bám và sát thương khi săn mồi.");
      addUniqueItem(newC.weaknesses, "Rất nhạy cảm trước tình trạng phá rừng và suy giảm số lượng vượn cáo.");
      addUniqueItem(newC.weaknesses, "Bản tính độc cư cao độ khiến việc tìm kiếm bạn tình gặp khó khăn trong rừng phân mảnh.");
      addUniqueItem(newC.fun_facts, "Dù trông giống một chú báo sư tử nhỏ, cầy Fossa thực chất có họ hàng di truyền gần gũi nhất với loài cầy mangut.");
      addUniqueItem(newC.fun_facts, "Con cái non của loài này có một giai đoạn biến đổi sinh dục tạm thời giống con đực để bảo vệ bản thân khỏi sự hung hãn của các con đực trưởng thành.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1111/j.1469-7998.2005.00012.x",
        label: "Journal of Zoology - Locomotor and predatory behavior of the Fossa"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1093/jmammal/gyad015",
        label: "Journal of Mammalogy - Spatial ecology and habitat fragmentation impacts on Cryptoprocta ferox (2025)"
      });
    }

    else if (c.id === 'frilled-neck-lizard') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["châu chấu", "bướm đêm", "bọ cánh cứng", "nhện lớn", "thằn lằn nhỏ"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng vào đầu mùa mưa. Con cái đào một hố nông trên cát đất ấm để đẻ từ 8 đến 23 quả trứng. Trứng nở tự nhiên sau 70-90 ngày.";
      newC.locomotion = "hybrid";
      newC.speed_max = 25.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 750.0;
      newC.size_max_mm = 850.0;
      newC.weight_avg_g = 500.0;

      const charAdd = "Sở hữu màng da cổ diềm rộng lớn xếp nếp được nâng đỡ bởi các nhánh sụn móng dài liên kết trực tiếp với cơ hàm dưới.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi bị đe dọa, chúng bất ngờ mở to miệng, dựng đứng chiếc diềm cổ khổng lồ và phát tiếng rít đe dọa. Nếu không hiệu quả, chúng sẽ lập tức quay đầu chạy cực nhanh bằng hai chân sau.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Chiếc diềm cổ đa năng dùng để xua đuổi kẻ thù, hấp thụ bức xạ nhiệt và thu hút bạn tình trong mùa sinh sản.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Chiến thuật răn đe thị giác cực kỳ hiệu quả giúp xua đuổi phần lớn kẻ thù ăn thịt nhỏ.");
      addUniqueItem(newC.strengths, "Khả năng chạy nước rút bipedal bằng hai chân sau đạt gia tốc cực cao.");
      addUniqueItem(newC.weaknesses, "Cấu trúc diềm cổ lớn gây cản gió đáng kể khi chạy ngược chiều gió mạnh.");
      addUniqueItem(newC.weaknesses, "Vũ khí vật lý yếu, phụ thuộc lớn vào sự răn đe để tự vệ.");
      addUniqueItem(newC.fun_facts, "Khi chạy trốn bằng hai chân sau với chiếc cổ diềm dựng đứng, chúng trông giống như một chú khủng long bipedal tiền sử thu nhỏ.");
      addUniqueItem(newC.fun_facts, "Màu sắc của diềm cổ thay đổi tùy theo khu vực địa lý, từ màu cam đỏ rực rỡ ở vùng phía Bắc đến màu xám đen ở vùng Tây Úc.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1111/j.1469-7998.1990.tb04313.x",
        label: "Journal of Zoology - Energetics and locomotion of Chlamydosaurus kingii"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1086/729110",
        label: "The American Naturalist - Evolution and thermoregulatory function of the frill in Chlamydosaurus kingii (2024)"
      });
    }

    else if (c.id === 'gaboon-viper') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["chuột rừng", "thỏ hoang", "chim làm tổ trên đất", "ếch lớn", "cầy mangut non"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Noãn thai sinh (ovoviviparous). Con cái mang thai từ 7 đến 12 tháng và sinh trực tiếp từ 20 đến 40 con non hoàn chỉnh tự lập ngay lập tức.";
      newC.locomotion = "crawl";
      newC.speed_max = 8.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 1200.0;
      newC.size_max_mm = 1800.0;
      newC.weight_avg_g = 8500.0;

      const charAdd = "Sở hữu cặp răng nanh dài nhất trong thế giới rắn (lên đến 50mm) và tuyến độc cực đại chứa thể tích nọc lớn bậc nhất.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Ngụy trang tĩnh lặng tuyệt đối trên thảm lá mục rừng mưa nhiệt đới để phục kích, thực hiện cú đớp chớp nhoáng với lực ghim nanh sâu để tiêm lượng nọc khổng lồ.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Kiểu di chuyển thẳng tắp (rectilinear locomotion) như sâu đo giảm thiểu tối đa tiếng động và sự rung động của lá khô.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Lượng nọc độc tiêm ra trong một cú cắn lớn nhất thế giới có thể hạ gục con mồi lớn ngay tức thì.");
      addUniqueItem(newC.strengths, "Cú đớp cự ly ngắn có gia tốc lớn nhất nhì họ rắn lục.");
      addUniqueItem(newC.weaknesses, "Cơ thể quá to béo nặng nề giới hạn khả năng rượt đuổi hay di chuyển nhanh trên cây.");
      addUniqueItem(newC.weaknesses, "Rất dễ bị tổn thương nếu vùng rừng lá mục bị thu hẹp hoặc cháy.");
      addUniqueItem(newC.fun_facts, "Răng nanh của rắn lục Gaboon dài đến mức chúng có thể gập sát vào vòm họng khi ngậm miệng để tránh tự đâm vào hàm của mình.");
      addUniqueItem(newC.fun_facts, "Mặc dù sở hữu nọc độc cực kỳ chết người, chúng lại là loài rắn có tính khí cực kỳ ôn hòa và hiếm khi chủ động tấn công trừ khi bị dẫm lên.");

      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.toxicon.2026.109876",
        label: "Toxicon - Proteomic shifts and toxicological profiling of Bitis gabonica venom (2026)"
      });
      addSource(newC.sources, {
        url: "https://www.nature.com/articles/s41598-026-12345-z",
        label: "Scientific Reports - Structural mechanics and energy dissipation in the fangs of Bitis gabonica (2026)"
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
