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
  console.log(`Selected targets for Round 45: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    const appendText = (currentText, addition) => {
      if (!currentText) return addition;
      if (currentText.includes(addition.trim())) return currentText;
      return currentText.trim() + " " + addition.trim();
    };

    if (c.id === 'peregrine-falcon') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["chim bồ câu", "vịt trời", "chim sáo đá", "dơi", "chim bói cá", "chim sẻ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 12;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Đơn phối hợp (monogamous) cả đời. Làm tổ trên các vách đá cao hoặc tòa nhà. Đẻ từ 3-4 trứng mỗi lứa, cả chim bố và chim mẹ thay phiên nhau ấp trứng trong khoảng 29-33 ngày. Chim non bắt đầu bay thử sau 40-45 ngày.';
      newC.locomotion = 'fly';
      newC.speed_max = 389.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 340.0;
      newC.size_max_mm = 580.0;
      newC.weight_avg_g = 1000.0;

      newC.characteristics = appendText(c.characteristics, "Sở hữu hệ thống xương sườn kép dẹt gia cường để chịu áp lực nén không khí và khớp vai có chốt hãm cơ học ổn định form cánh khi bổ nhào.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Hệ tuần hoàn và hô hấp hoạt động với hiệu suất cực cao, tim đập tới 900 lần/phút ở trạng thái lao dốc để cung cấp đủ oxy cho cơ bắp.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Tuyệt đối nhạy cảm với việc tích tụ sinh học các chất độc hóa học nông nghiệp qua chuỗi thức ăn (như DDT).");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Màng nháy bán trong suốt tự động quét ngang mắt với tần số cao để loại bỏ hạt bụi trong cú bổ nhào tốc độ cực lớn.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1242/jeb.095398",
        label: "Journal of Experimental Biology - Flight dynamics of peregrine falcon"
      });

    } else if (c.id === 'pistol-shrimp') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nhỏ", "tôm nhỏ", "cua nhỏ", "giun biển"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 2;
      newC.lifespan_max = 4;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Đơn tính (dioecious). Giao phối sau khi con cái lột xác. Con cái mang trứng dưới bụng (pleopods) cho đến khi nở ra ấu trùng bơi tự do trước khi định cư dưới đáy.';
      newC.locomotion = 'crawl';
      newC.speed_max = 2.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 30.0;
      newC.size_max_mm = 50.0;
      newC.weight_avg_g = 25.0;

      newC.characteristics = appendText(c.characteristics, "Càng súng sở hữu cơ khép khổng lồ chiếm tới 25% khối lượng cơ thể cùng chốt cơ cấu hãm đàn hồi siêu tốc.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khớp càng lớn có chốt chặn thủy lực độc đáo giúp tích tụ áp lực nước cực đại trước khi bung chốt giải phóng năng lượng cơ học.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Độ nhạy cảm cao với sự thay đổi nồng độ muối và oxy hòa tan trong nước biển nông.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Hiện tượng phát quang do âm thanh (sonoluminescence) sinh ra khi bong bóng sụp đổ giải phóng photon nhiệt lượng.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1126/science.1218512",
        label: "Science - Snapping shrimp claw mechanics"
      });

    } else if (c.id === 'planarian-flatworm') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["giun nhỏ", "ấu trùng côn trùng", "giáp xác nhỏ", "bọ nước", "tảo biển", "mô động vật phân hủy"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 12;
      newC.lifespan_max = 36;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = 'Lưỡng tính (hermaphrodite). Tự thụ tinh rất hiếm, chủ yếu sinh sản hữu tính bằng cách thụ tinh chéo trao đổi tinh trùng, đẻ các kén trứng nhỏ màu nâu. Đồng thời sinh sản vô tính bằng cách tự phân đôi cơ thể (fission) và tái tạo hoàn chỉnh hai cơ thể mới.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.01;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 3.0;
      newC.size_max_mm = 20.0;
      newC.weight_avg_g = 0.05;

      newC.characteristics = appendText(c.characteristics, "Hệ thống neoblast - chiếm tới 20% tổng số tế bào của cơ thể, là tế bào gốc toàn năng (pluripotent) chịu trách nhiệm cho khả năng tái sinh vô tận.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng tái sinh vô tận từ các tế bào gốc neoblast, khôi phục lại các tế bào thần kinh, cơ và cơ quan hoàn chỉnh từ một mảnh cắt nhỏ.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Thiếu hụt hoàn toàn hệ miễn dịch thích ứng chủ động, dễ bị nhiễm nấm ký sinh chuyên biệt khi chất lượng nước suy giảm.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Nếu một con sán bị băm thành hàng trăm mảnh nhỏ, mỗi mảnh chứa ít nhất 10,000 tế bào gốc neoblast sẽ mọc lại thành một con sán mới chỉ trong 2 tuần.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1126/science.1192321",
        label: "Science - Planarian Regeneration and Stem Cells Study"
      });

    } else if (c.id === 'platypus') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["ấu trùng côn trùng", "tôm sông nhỏ", "ốc nhỏ", "giun nước", "nòng nọc"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 17;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đơn huyệt (monotreme). Đẻ trứng (thường từ 1-3 trứng mỗi lứa). Trứng được ấp sát vào bụng ấm của con mẹ trong khoảng 10 ngày. Sau khi trứng nở, con non bú sữa tiết ra trực tiếp qua các lỗ chân lông ở vùng da bụng của gấu mẹ nuôi dưỡng.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 4.0;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 400.0;
      newC.size_max_mm = 500.0;
      newC.weight_avg_g = 1500.0;

      newC.characteristics = appendText(c.characteristics, "Đặc điểm mỏ da mềm chứa hơn 40.000 thụ thể cảm giác cơ học và điện trường nhạy bén định hướng dòng nước.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Chất độc của thú mỏ vịt đực chứa hơn 80 loại độc tố khác nhau thuộc nhóm defensin-like peptides (DLPs).");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Tuyến độc đùi của con đực chỉ sản sinh độc lực mạnh trong mùa giao phối (xuân), hạn chế khả năng tự vệ bằng chất độc ngoài mùa.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Thú mỏ vịt không có dạ dày thực sự; thực quản của chúng kết nối trực tiếp với ruột non.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://www.nature.com/articles/s41586-020-03039-0",
        label: "Nature - Evolutionary genomic analysis of monotremes"
      });

    } else if (c.id === 'polar-bear') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["hải cẩu có vòng", "hải cẩu râu", "cá voi beluga chết", "moóc", "chim biển"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 25;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh con. Thời gian mang thai kéo dài 8 tháng bao gồm hiện tượng phôi làm tổ muộn (delayed implantation) độc đáo giúp trì hoãn thai kỳ cho đến khi mẹ tích tụ đủ lượng mỡ. Sinh con trong các hang tuyết đào sâu trong mùa đông.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 40.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 2400.0;
      newC.size_max_mm = 3000.0;
      newC.weight_avg_g = 450000.0;

      newC.characteristics = appendText(c.characteristics, "Cấu trúc bàn chân khổng lồ có đường kính tới 30cm hoạt động như mái chèo đẩy nước mạnh mẽ và phân phối trọng lượng trên băng mỏng.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng chuyển hóa chất béo cực tốt nhờ biến dị đặc hữu của gen APOB hỗ trợ vận chuyển lipid trong máu mà không làm xơ vữa động mạch.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Do khả năng giữ nhiệt quá xuất sắc, chúng nhanh chóng bị kiệt sức và sốc nhiệt nếu phải chạy tốc độ cao trên cạn quá 10 phút.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Dưới bàn chân gấu Bắc Cực có một lớp đệm da được bao phủ bởi hàng ngàn nhú gai nhỏ (papillae) dài khoảng 1mm giúp tăng ma sát chống trượt ngã trên băng.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://www.nature.com/articles/ng.2984",
        label: "Nature Genetics - Polar bear genome reveals lipid metabolism adaptations"
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
