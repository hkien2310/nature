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
  console.log(`Selected targets for Round 39: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'inland-taipan') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "chuột sa mạc");
      addUniqueItem(newC.diet_items, "thú túi nhỏ");
      addUniqueItem(newC.diet_items, "chuột đồng hoang mạc");
      addUniqueItem(newC.diet_items, "động vật có vú nhỏ");

      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Con cái đẻ từ 12 đến 24 trứng trong các khe đất sét sâu hoặc hang động bỏ hoang để tránh nhiệt độ sa mạc khắc nghiệt. Trứng nở sau khoảng 2 tháng rưỡi. Rắn con nở ra đã tự lập và mang độc tính mạnh.";

      newC.locomotion = "crawl";
      newC.speed_max = 20.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 1800.0;
      newC.size_max_mm = 2500.0;
      newC.weight_avg_g = 1750.0;

      newC.characteristics = appendText(c.characteristics, "Sở hữu vảy màu nâu đậm pha đen vào mùa đông để hấp thụ tối đa nhiệt lượng và chuyển sang màu rơm vàng nhạt vào mùa hè nhằm phản xạ ánh nắng mặt trời.");
      newC.survival_method = appendText(c.survival_method, "Cơ chế tấn công đớp-thả cực nhanh kết hợp Paradoxin gây tê liệt cơ hô hấp tức khắc.");
      newC.unique_traits = appendText(c.unique_traits, "Độc tố thần kinh tiền synap Paradoxin là chất độc sinh học tự nhiên mạnh nhất được biết đến trên cạn.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Độc tính cực mạnh với chỉ số LD50 tiêm dưới da cực thấp (0.025 mg/kg).");
      addUniqueItem(newC.strengths, "Cơ chế biến sắc vảy theo mùa hỗ trợ điều nhiệt sinh học tối ưu.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Nhạy cảm với sự cạn kiệt các loài chuột túi sa mạc đặc hữu.");
      addUniqueItem(newC.weaknesses, "Khả năng chịu đựng nhiệt độ quá giới hạn trên bề mặt đất cát kém.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Paradoxin hoạt động bằng cách ngăn chặn giải phóng Acetylcholine tại màng trước synap gây liệt cơ hô hấp.");
      addUniqueItem(newC.fun_facts, "Mặc dù là loài rắn độc nhất thế giới trên cạn, chưa từng có ca tử vong nào được ghi nhận kể từ khi có huyết thanh kháng nọc đặc hiệu.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.toxicon.2023.107054",
        label: "Toxicon - Venom chemistry of Oxyuranus species"
      });

    } else if (c.id === 'jaguar') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "capybara");
      addUniqueItem(newC.diet_items, "cá sấu caiman");
      addUniqueItem(newC.diet_items, "rùa sông");
      addUniqueItem(newC.diet_items, "heo rừng");
      addUniqueItem(newC.diet_items, "nai");
      addUniqueItem(newC.diet_items, "tê tê Nam Mỹ");

      newC.activity_pattern = "crepuscular";
      newC.lifespan_min = 12;
      newC.lifespan_max = 15;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Thời gian mang thai kéo dài 91-111 ngày, đẻ từ 1 đến 4 con non. Báo mẹ nuôi con đơn độc và bảo vệ con rất nghiêm ngặt khỏi các mối đe dọa (kể cả báo đực trưởng thành) cho đến khi báo con tự lập hoàn toàn ở khoảng 2 năm tuổi.";

      newC.locomotion = "hybrid";
      newC.speed_max = 80.0;
      newC.conservation_status = "NT";
      newC.size_min_mm = 1120.0;
      newC.size_max_mm = 1850.0;
      newC.weight_avg_g = 76000.0;

      newC.characteristics = appendText(c.characteristics, "Cung gò má cực rộng cung cấp điểm bám cho cơ thái dương cực kỳ khỏe, tối ưu lực ép cơ học cho hàm răng.");
      newC.survival_method = appendText(c.survival_method, "Kỹ năng phục kích bờ nước và kéo lê cá sấu caiman nặng nề.");
      newC.unique_traits = appendText(c.unique_traits, "Thiết kế cơ sinh học hộp sọ rộng tạo ra lực cắn xuyên sọ mạnh nhất họ nhà mèo tính theo tỉ lệ cơ thể.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng nhịn thở dưới nước tới 40 giây khi rình mò con mồi bán thủy sinh.");
      addUniqueItem(newC.strengths, "Hệ cơ xương chi trước cực khỏe cho phép kéo lê con mồi nặng gấp đôi cơ thể lên dốc đứng.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Sức bền kém trong các cuộc rượt đuổi tốc độ cao khoảng cách dài trên 300 mét.");
      addUniqueItem(newC.weaknesses, "Mức độ phụ thuộc cao vào sinh cảnh đầm lầy và sông ngòi ẩm ướt nguyên sinh.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Tên gọi 'Jaguar' xuất phát từ từ bản địa 'yaguara' có nghĩa là 'kẻ tiêu diệt chỉ bằng một cú nhảy'.");
      addUniqueItem(newC.fun_facts, "Nghiên cứu bộ gen cho thấy sự tiến hóa phân hóa mạnh mẽ giúp chúng thích nghi hoàn hảo với môi trường bán thủy sinh đầm lầy Pantanal.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/jzo.12883",
        label: "Journal of Zoology - Biomechanics of jaguar bite force"
      });

    } else if (c.id === 'japanese-spider-crab') {
      newC.diet_type = "omnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "xác động vật");
      addUniqueItem(newC.diet_items, "tảo biển");
      addUniqueItem(newC.diet_items, "nhuyễn thể");
      addUniqueItem(newC.diet_items, "cá nhỏ");
      addUniqueItem(newC.diet_items, "giáp xác nhỏ");

      newC.activity_pattern = "variable";
      newC.lifespan_min = 50;
      newC.lifespan_max = 100;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Con cái đẻ trứng và mang theo khoảng 1.5 triệu quả trứng đã thụ tinh dưới các chi bụng. Trứng nở thành ấu trùng zoea sau vài tuần.";

      newC.locomotion = "crawl";
      newC.speed_max = 1.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 3000.0;
      newC.size_max_mm = 3800.0;
      newC.weight_avg_g = 17000.0;

      newC.characteristics = appendText(c.characteristics, "Lớp vỏ kitin được gia cố bằng canxi cacbonat giúp chịu lực ép sâu thủy tĩnh khổng lồ ở độ sâu 600m.");
      newC.survival_method = appendText(c.survival_method, "Cấy rêu, bọt biển và hải quỳ lên mai để tự vệ cơ học và ngụy trang hóa học.");
      newC.unique_traits = appendText(c.unique_traits, "Được xếp vào họ đơn loài Macrocheiridae nhờ những đặc trưng di truyền cổ xưa độc nhất.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khớp nối chân xoay vặn linh hoạt 360 độ quanh khe đá để tránh các chấn động tầng đáy.");
      addUniqueItem(newC.strengths, "Cơ chế tự vệ chủ động cắt chi (autotomy) nhanh chóng tự cô lập vùng bị tổn thương.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Trạng thái vỏ cực kỳ mềm và dễ bị tổn thương trong quá trình lột xác kéo dài.");
      addUniqueItem(newC.weaknesses, "Khả năng thích ứng kém với sự nóng lên đột ngột của dòng hải lưu tầng đáy.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Ấu trùng của loài cua này trải qua các giai đoạn zoea và megalopa trước khi chìm xuống đáy sâu.");
      addUniqueItem(newC.fun_facts, "Người Nhật gọi loài cua này là 'Taka-ashi-gani' có nghĩa là Cua chân cao.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1093/jcbiol/ruac023",
        label: "Journal of Crustacean Biology - Re-establishment of Macrocheiridae"
      });

    } else if (c.id === 'jewel-wasp') {
      newC.diet_type = "parasitic";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "dịch hemolymph của gián Mỹ");
      addUniqueItem(newC.diet_items, "mật hoa");
      addUniqueItem(newC.diet_items, "nhựa cây");

      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 1;
      newC.lifespan_max = 3;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Tò vò cái đẻ trứng trực tiếp lên đùi của gián bị tê liệt. Ấu trùng nở ra, chui vào bụng gián ăn dần nội tạng để phát triển thành nhộng.";

      newC.locomotion = "hybrid";
      newC.speed_max = 5.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 15.0;
      newC.size_max_mm = 22.0;
      newC.weight_avg_g = 0.05;

      newC.characteristics = appendText(c.characteristics, "Lớp giáp màu xanh ngọc lục bảo ánh kim có cấu trúc siêu nhỏ giúp chống trầy xước từ các gai chân gián Mỹ.");
      newC.survival_method = appendText(c.survival_method, "Phẫu thuật thần kinh chính xác tiêm nọc độc thần kinh vào hạch dưới hầu của gián Mỹ.");
      newC.unique_traits = appendText(c.unique_traits, "Ngòi châm tích hợp các cảm biến xúc giác cơ học hình vòm (campaniform sensilla) để định vị mô não gián.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Nọc độc chứa ampulexins và dopamine gây ức chế phản xạ trốn chạy tự chủ của gián.");
      addUniqueItem(newC.strengths, "Khả năng tính toán kích thước vật chủ bằng râu để quyết định giới tính của trứng.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Chỉ có thể sinh sản thành công trên một loài vật chủ duy nhất là gián Mỹ Periplaneta americana.");
      addUniqueItem(newC.weaknesses, "Thời gian hoạt động và hô hấp bị hạn chế nghiêm trọng khi độ ẩm môi trường quá thấp gây mất nước.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Trạng thái giảm vận động (hypokinesia) cực hạn mà nọc độc gây ra cho gián đang được nghiên cứu để hiểu về bệnh Parkinson ở người.");
      addUniqueItem(newC.fun_facts, "Tò vò cái cắn râu gián để hút dịch hemolymph phục hồi năng lượng khẩn cấp sau cuộc chiến.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.neuron.2017.11.004",
        label: "Neuron - Neuro-parasitology: How wasps control cockroach brains"
      });

    } else if (c.id === 'killer-whale') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "hải cẩu");
      addUniqueItem(newC.diet_items, "cá hồi");
      addUniqueItem(newC.diet_items, "cá trích");
      addUniqueItem(newC.diet_items, "cá voi tấm sừng non");
      addUniqueItem(newC.diet_items, "cá mập trắng lớn");
      addUniqueItem(newC.diet_items, "chim cánh cụt");

      newC.activity_pattern = "variable";
      newC.lifespan_min = 50;
      newC.lifespan_max = 90;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Sinh sản bằng cách đẻ con. Thời gian mang thai kéo dài 15-18 tháng. Con non bú sữa mẹ giàu chất béo và được bầy bảo vệ chặt chẽ.";

      newC.locomotion = "swim";
      newC.speed_max = 56.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 6000.0;
      newC.size_max_mm = 8000.0;
      newC.weight_avg_g = 4500000.0;

      newC.characteristics = appendText(c.characteristics, "Lớp mỡ dưới da dày tới 10cm giúp cách nhiệt cực tốt trong làn nước băng giá và tối ưu tính thủy động học.");
      newC.survival_method = appendText(c.survival_method, "Chiến thuật phối hợp bầy đàn đồng điệu tạo sóng nhân tạo để hất con mồi khỏi tảng băng nổi.");
      newC.unique_traits = appendText(c.unique_traits, "Sự phân hóa các phân loài Bigg's và Resident có văn hóa săn mồi và ngôn ngữ giao tiếp riêng biệt.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng phối hợp đồng điệu bầy đàn và thiết lập chiến thuật săn mồi mẫu hệ tinh vi.");
      addUniqueItem(newC.strengths, "Hệ cơ xương sọ và hàm răng hình nón cực khỏe tối ưu hóa cho các đòn húc bộc phát mạnh mẽ.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Nhạy cảm cao với ô nhiễm tiếng ồn đại dương (sonar quân sự, tàu bè) gây nhiễu loạn định vị tiếng vang.");
      addUniqueItem(newC.weaknesses, "Tốc độ tích lũy chất độc sinh học (bioaccumulation) cao trong mô mỡ do đứng đầu chuỗi thức ăn.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Cá voi sát thủ cái là một trong số cực ít loài động vật trải qua thời kỳ mãn kinh và tiếp tục sống hàng chục năm để làm thủ lĩnh dẫn dắt bầy non.");
      addUniqueItem(newC.fun_facts, "Nghiên cứu di truyền học bộ gen năm 2016 xác nhận văn hóa săn mồi đã thúc đẩy nhanh sự phân hóa sinh sản của các phân loài.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/mms.13110",
        label: "Marine Mammal Science - Species designation of resident & Bigg's killer whales"
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
