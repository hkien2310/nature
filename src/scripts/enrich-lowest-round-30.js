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
  console.log(`Selected targets for Round 30: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated source helper
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

    if (c.id === 'cookiecutter-shark') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["cá mập lớn", "cá voi", "cá heo", "mực biển sâu", "cá ngừ lớn"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 15;
      newC.lifespan_max = 25;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Đẻ con (viviparous) nhờ cơ chế noãn thai sinh. Phôi phát triển hoàn toàn trong tử cung của mẹ và tự tiêu thụ noãn hoàng trước khi đẻ ra từ 6-12 con non.";
      newC.locomotion = "swim";
      newC.speed_max = 8.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 560.0;
      newC.weight_avg_g = 400.0;

      const charAdd = "Thân hình trụ thuôn dài màu nâu xám với lớp phát quang sinh học màu xanh lục đậm dưới bụng ngoại trừ vùng cổ màu đen trông như vòng cổ giả dụ mồi.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Thực hiện di cư dọc hàng ngày (Diel Vertical Migration), ngoi lên vùng nước nông vào ban đêm để tiếp cận con mồi lớn, cắn những miếng thịt hình tròn hoàn hảo.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Cú cắn hình tròn bánh quy hoàn hảo nhờ bộ hàm tròn biến tính với răng dưới liền khối dạng lưỡi dao và môi bám hút chân không cực mạnh.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Hàm răng răng dưới liền khối bén nhọn cắt mồi hình tròn hoàn hảo");
      addUniqueItem(newC.strengths, "Khả năng phát quang sinh học xanh lục ngụy trang ngược dưới bụng");
      addUniqueItem(newC.weaknesses, "Tốc độ bơi chậm chạp, không thích nghi săn đuổi chủ động đường dài");
      addUniqueItem(newC.fun_facts, "Vết cắn của chúng có thể làm hỏng lớp vỏ cao su bảo vệ của các tàu ngầm hạt nhân");

      addSource(newC.sources, {
        url: "https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/isistius-brasiliensis/",
        label: "Florida Museum - Cookiecutter Shark Fact Sheet"
      });
    }

    else if (c.id === 'cuttlefish') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["cua đá", "tôm cát", "cá nhỏ", "giun biển", "ốc biển"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Sinh sản hữu tính đẻ trứng. Con đực phô diễn các hoa văn sọc màu lấp lánh để quyến rũ con cái và chuyển túi tinh spermatophore bằng xúc tu biến đổi đặc hữu.";
      newC.locomotion = "swim";
      newC.speed_max = 20.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 500.0;
      newC.weight_avg_g = 4000.0;

      const charAdd = "Sở hữu cấu trúc xương xốp cuttlebone chứa khí nitơ giúp điều hòa sức nổi vô cùng chuẩn xác, cùng hệ thống mắt phức tạp có đồng tử hình chữ W.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Đổi màu da và kết cấu gai thịt chỉ trong 0.2 giây nhờ hệ sắc tế bào chromatophores co giãn chủ động điều khiển trực tiếp từ não.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Khả năng ngụy trang ngụy trạng năng động bậc thầy điều khiển luồng ánh sáng phản xạ phân cực qua lớp tế bào iridophores.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Ngụy trang năng động bậc thầy thay đổi màu và kết cấu da siêu tốc");
      addUniqueItem(newC.strengths, "Tầm nhìn mắt phân cực phát hiện con mồi tàng hình hiệu quả");
      addUniqueItem(newC.weaknesses, "Tuổi thọ cực kỳ ngắn ngủi chỉ từ 1 đến 2 năm trong tự nhiên");
      addUniqueItem(newC.fun_facts, "Đồng tử hình chữ W độc đáo của chúng giúp lọc ánh sáng phân cực và tăng độ tương phản hình ảnh");

      addSource(newC.sources, {
        url: "https://www.montereybayaquarium.org/animals/animals-a-to-z/common-cuttlefish",
        label: "Monterey Bay Aquarium - Common Cuttlefish Profile"
      });
    }

    else if (c.id === 'diving-bell-spider') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["ấu trùng muỗi nước", "bọ nước", "tôm nhỏ", "nòng nọc nhỏ", "giun đỏ"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Sinh sản trong chuông nước. Con cái dệt túi kén trứng chứa 30-70 trứng bám chắc vào vòm tổ và bảo vệ trứng cho đến khi nhện non nở.";
      newC.locomotion = "swim";
      newC.speed_max = 2.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 8.0;
      newC.size_max_mm = 15.0;
      newC.weight_avg_g = 0.15;

      const charAdd = "Tơ nhện chứa hàm lượng cao protein spidroin liên kết ngang kháng thủy phân hóa, duy trì vòm chuông không rách trong nước ngọt.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Thu thập bọt khí bằng lông kỵ nước bọc sáp alkane ở bụng đem xuống tích lũy dưới mạng tổ, hoạt động như mang vật lý trao đổi khí.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Khả năng trao đổi khí thụ động qua màng tơ chuông lặn theo định luật khuếch tán Fick giúp lấy oxy hòa tan từ nước.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Mang vật lý chuông lặn trao đổi khí thông minh dưới nước ngọt");
      addUniqueItem(newC.strengths, "Lông hydrophobic setae bọc sáp bền bẫy bong bóng khí");
      addUniqueItem(newC.weaknesses, "Phụ thuộc hoàn toàn vào bong bóng khí dự trữ và tổ chuông nước dệt thủ công");
      addUniqueItem(newC.fun_facts, "Là loài nhện duy nhất trên thế giới tiến hóa sống trọn vòng đời dưới nước ngọt");

      addSource(newC.sources, {
        url: "https://doi.org/10.1242/jeb.056085",
        label: "JEB - Physical gills of diving bell spider Argyroneta aquatica"
      });
    }

    else if (c.id === 'draco-lizard') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["kiến", "mối", "ruồi", "nhện nhỏ tán cây", "côn trùng nhỏ khác"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng. Con cái hạ tán cây xuống đất đào hố đẻ 2-5 quả trứng, lấp lá khô bảo vệ trứng trong 24 giờ rồi nhanh chóng quay lại tán cây.";
      newC.locomotion = "hybrid";
      newC.speed_max = 20.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 190.0;
      newC.size_max_mm = 220.0;
      newC.weight_avg_g = 7.0;

      const charAdd = "Màng da patagium hai bên sườn được chống đỡ bằng 5-7 cặp xương sườn kéo dài cơ động điều khiển bởi nhóm cơ ilio-costalis chuyên dụng.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Lượn không trung cự ly xa từ 9 đến 15 mét giữa các tán rừng cây cổ thụ để thoát hiểm chớp nhoáng khỏi thú săn mồi.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Yếm cổ dewlap hoạt động như cánh ổn định phía trước để triệt tiêu mô-men xoắn gây cắm đầu khi cất cánh lượn.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Bung cánh lượn patagium siêu tốc dưới 0.1 giây");
      addUniqueItem(newC.strengths, "Đuôi dài mảnh hoạt động như bánh lái quán tính khí động học chính xác");
      addUniqueItem(newC.weaknesses, "Rất dễ bị tổn thương vật lý khi màng cánh mỏng bị rách rách");
      addUniqueItem(newC.fun_facts, "Hai chân trước có khớp kẹp mép cánh patagium làm bề mặt vi chỉnh lực nâng");

      addSource(newC.sources, {
        url: "https://www.biologists.com/jeb/content/214/19/3225",
        label: "JEB - Aerodynamics and kinematics of Draco lizards"
      });
    }

    else if (c.id === 'dracula-ant') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["rết nhỏ", "ấu trùng sâu đất", "bọ cánh cứng nhỏ", "nhộng kiến khác"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 1;
      newC.lifespan_max = 3;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Sinh sản bầy đàn có kiểm soát. Kiến chúa sinh trứng, kiến thợ nuôi dưỡng ấu trùng bằng thịt côn trùng đập nát. Kiến thợ trưởng thành chọc hút dịch hemolymph từ lớp biểu bì ấu trùng để hấp thu nitơ.";
      newC.locomotion = "walk";
      newC.speed_max = 0.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 1.5;
      newC.size_max_mm = 2.5;
      newC.weight_avg_g = 0.005;

      const charAdd = "Hàm dưới phẳng dẹt biến dạng cơ học dạng spring-loaded khớp trượt, tạo tích lũy thế năng cơ đàn hồi lớn để phát lực cắn nhanh nhất hành tinh.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Đào hang ẩn nấp sâu dưới mùn đất mục nhiệt đới, săn mồi rết và côn trùng nhỏ bằng phản xạ trượt hàm gây chấn động làm tê liệt con mồi.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Tập tính ma cà rồng không gây chết (non-lethal larval hemolymph feeding) hút dịch bạch huyết từ ấu trùng của mình để sinh tồn, cùng tốc độ đớp hàm nhanh nhất thế giới sinh vật.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Cú cắn snapping strike tốc độ cực đại đạt 90 m/s");
      addUniqueItem(newC.strengths, "Tập tính nuôi dưỡng ấu trùng làm dạ dày bầy đàn chuyển hóa chất rắn hữu cơ");
      addUniqueItem(newC.weaknesses, "Cơ quan thị giác thoái hóa gần như mù hoàn toàn do sống dưới mùn đất ẩm");
      addUniqueItem(newC.fun_facts, "Cú đớp hàm của chúng nhanh gấp 5000 lần một chớp mắt của con người nhờ thế năng tích tụ ở khớp hàm");

      addSource(newC.sources, {
        url: "https://doi.org/10.1098/rsos.181254",
        label: "Royal Society Open Science - Snapping mandible mechanics in Adetomyrma"
      });
    }

    else if (c.id === 'deathstalker-scorpion') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["dế hoang mạc", "gián cát", "ấu trùng côn trùng", "nhện nhỏ", "bọ cạp nhỏ khác"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 4;
      newC.lifespan_max = 8;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Đại diện hiếm hoi đẻ con (viviparous) trong nhóm chân khớp. Thời gian mang thai kéo dài 4-5 tháng, con non sinh ra có màng mỏng bao bọc và ngay lập tức leo lên lưng mẹ để sống sót.";
      newC.locomotion = "walk";
      newC.speed_max = 5.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 110.0;
      newC.weight_avg_g = 2.0;

      const charAdd = "Tuyến độc chứa hỗn hợp peptide độc lực cực cao tác động vào các tế bào cơ tim và hệ thần kinh ngoại biên, kết hợp cấu trúc ngòi chích cong nhọn làm từ chitin hóa sừng cứng vững.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Đào các hốc nhỏ dưới phiến đá hoặc chui sâu dưới cát mịn vào ban ngày để tránh mất nước tối đa, hạ mức trao đổi chất sinh lý thấp nhất.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Bộ lông cảm biến siêu nhạy Trichobothria phân bố trên các chân giúp đo đạc chính xác sóng rung cơ học cực nhỏ lan truyền trong cát.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Nọc độc độc tố thần kinh cực mạnh nhắm mục tiêu chuẩn xác tế bào");
      addUniqueItem(newC.strengths, "Hệ thống lông Trichobothria cảm biến rung động cát siêu nhạy");
      addUniqueItem(newC.weaknesses, "Không thể bò trên các bề mặt nhẵn bóng do cấu trúc móng bám cát chuyên biệt");
      addUniqueItem(newC.fun_facts, "Nọc độc chứa chlorotoxin giúp đánh dấu tế bào u thần kinh đệm trong phẫu thuật não");

      addSource(newC.sources, {
        url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3839218/",
        label: "PMC - Chlorotoxin in Cancer Research"
      });
    }

    else if (c.id === 'deep-sea-anglerfish') {
      newC.diet_type = "carnivore";
      newC.diet_items = ["cá nhỏ sâu", "giáp xác biển sâu", "mực ống nhỏ", "tôm krill sâu"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 10;
      newC.lifespan_max = 30;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Ký sinh sinh dục dị biệt. Con đực siêu nhỏ cắn vào cơ thể con cái, hòa hợp da thịt và chia sẻ tuần hoàn vĩnh viễn, biến thành cơ quan sản sinh tinh dịch thụ động.";
      newC.locomotion = "swim";
      newC.speed_max = 1.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 30.0;
      newC.size_max_mm = 180.0;
      newC.weight_avg_g = 500.0;

      const charAdd = "Bộ hàm mở rộng khớp xoay cơ học tới 120 độ trang bị răng dài sắc nhọn cong ngược vào trong, hỗ trợ đắc lực việc nuốt chửng con mồi lớn gấp đôi cơ thể.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng Esca phát quang chứa hàng tỷ vi khuẩn Photobacterium cộng sinh tạo nguồn ánh sáng lục dụ mồi thụ động giữa bóng tối tuyệt đối của đáy đại dương.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Cơ chế loại bỏ lympho T và tế bào miễn dịch thích ứng giúp cơ thể con cái không đào thải cơ thể con đực khi dung hợp mô mạch máu.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Dạ dày cực kỳ co giãn cho phép nuốt mồi lớn gấp đôi cơ thể");
      addUniqueItem(newC.strengths, "Bẫy ánh sáng sinh học Esca dụ mồi thụ động hiệu quả");
      addUniqueItem(newC.weaknesses, "Cơ xương sụn giảm thiểu tối đa khiến lực cắn cơ học thực tế rất yếu");
      addUniqueItem(newC.fun_facts, "Da của chúng hấp thụ tới 99.9% photon ánh sáng mặt trời nhờ cấu trúc melanosome siêu tụ tụ");

      addSource(newC.sources, {
        url: "https://www.science.org/doi/10.1126/science.aaz9282",
        label: "Science - Anglerfish sexual parasitism genomic study"
      });
    }

    else if (c.id === 'diabolical-ironclad-beetle') {
      newC.diet_type = "detritivore";
      newC.diet_items = ["nấm gỗ", "vỏ cây khô phân hủy", "vụn thực vật mục nát", "địa y"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 2;
      newC.lifespan_max = 8;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng đơn lẻ dưới các kẽ vỏ cây sồi già khô. Ấu trùng ăn chất hữu cơ hoai mục trước khi làm kén hóa nhộng phát triển thành bọ trưởng thành.";
      newC.locomotion = "crawl";
      newC.speed_max = 0.2;
      newC.conservation_status = "LC";
      newC.size_min_mm = 15.0;
      newC.size_max_mm = 25.0;
      newC.weight_avg_g = 0.15;

      const charAdd = "Cấu trúc vỏ elytra chứa tỷ lệ sừng protein đàn hồi cực cao đan cài kiểu răng cưa elip phân lớp, chống chịu nén cơ học tĩnh phi thường.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi chịu tải trọng lớn, các phiến khớp trượt nhẹ lên nhau thông qua cấu trúc delamination để tiêu tán ứng lực chấn chấn động.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitsAdd = "Khớp liên kết răng khóa dạng zipper độc nhất liên kết elytra với tấm ức dưới bụng để khóa chặt toàn bộ cấu trúc cơ thể.";
      if (!c.unique_traits || !c.unique_traits.includes(traitsAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitsAdd;
      }

      addUniqueItem(newC.strengths, "Vỏ giáp cơ học elytra chịu tải trọng tĩnh nén cực hạn lên tới 149N");
      addUniqueItem(newC.strengths, "Khả năng giả chết thanatosis lừa động vật săn mồi hiệu quả");
      addUniqueItem(newC.weaknesses, "Không thể bay và di chuyển cực kỳ chậm chạp do elytra tiêu biến khớp động");
      addUniqueItem(newC.fun_facts, "Các kỹ sư mô phỏng cấu trúc khớp răng cưa jigsaw của vỏ bọ này để phát triển vật liệu hàng không vũ trụ");

      addSource(newC.sources, {
        url: "https://doi.org/10.1038/s41586-020-2813-8",
        label: "Nature - Toughening mechanisms of the diabolical ironclad beetle"
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
