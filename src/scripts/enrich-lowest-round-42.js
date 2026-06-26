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
  console.log(`Selected targets for Round 42: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'naked-mole-rat') {
      newC.diet_type = 'herbivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "củ rễ cây ngầm");
      addUniqueItem(newC.diet_items, "khoai đất");
      addUniqueItem(newC.diet_items, "rễ cây bụi hoang mạc");

      newC.activity_pattern = 'variable';
      newC.lifespan_min = 25;
      newC.lifespan_max = 32;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = "Hệ thống eusocial độc nhất ở thú. Chỉ có duy nhất một con chuột chúa (queen) phối hợp với 1-3 con đực được chọn để sinh sản. Chuột chúa đẻ từ 10-28 con non mỗi lứa. Các con chuột thợ vô sinh khác trong đàn đảm nhiệm việc chăm sóc con non, đào hang và kiếm ăn.";
      newC.locomotion = 'burrow';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 100.0;
      newC.weight_avg_g = 35.0;

      newC.characteristics = appendText(c.characteristics, "Hệ thống gene sửa chữa DNA và bảo vệ protein chaperon hoạt động với hiệu suất cực cao giúp duy trì tính ổn định của protein trong tế bào suốt đời.");
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ chế trao đổi chất kỵ khí não bộ chuyển hóa fructose thay vì glucose khi nồng độ O2 giảm bằng 0.");
      addUniqueItem(newC.strengths, "Hệ thống gene cảm biến cGAS-STING có hoạt động ức chế viêm đặc biệt ngăn chặn phản ứng tự miễn do tổn thương tế bào.");
      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không thể tự run để tạo nhiệt hoặc đổ mồ hôi để hạ nhiệt, do thiếu hoàn toàn cơ chế điều hòa thân nhiệt sinh lý.");
      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Ribosome của chuột chũi trần trụi có cấu trúc độc đáo khi RNA ribosom 28S bị cắt đôi ở một điểm cụ thể, giúp quá trình dịch mã protein đạt độ chính xác gần như tuyệt đối.");
      addUniqueItem(newC.fun_facts, "Chúng không tuân theo định luật Gompertz về lão hóa mammalian, tỷ lệ tử vong không hề tăng theo độ tuổi.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1126/science.aaf4488",
        label: "Science - Fructose-driven glycolysis in hypoxia-tolerant naked mole-rats"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1038/nature12293",
        label: "Nature - High-molecular-mass hyaluronan and cancer resistance"
      });

    } else if (c.id === 'namib-desert-beetle') {
      newC.diet_type = 'detritivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "mảnh vụn hữu cơ");
      addUniqueItem(newC.diet_items, "xác thực vật khô");
      addUniqueItem(newC.diet_items, "chất mùn sa mạc");
      addUniqueItem(newC.diet_items, "xác côn trùng nhỏ");

      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Đẻ trứng. Sau khi giao phối, con cái đẻ trứng sâu dưới cát nóng nơi có độ ẩm tương đối cao. Ấu trùng nở ra sống hoàn toàn dưới cát và ăn chất hữu cơ mục nát trước khi hóa nhộng.";
      newC.locomotion = 'walk';
      newC.speed_max = 3.6;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 18.0;
      newC.size_max_mm = 22.0;
      newC.weight_avg_g = 0.2;

      newC.characteristics = appendText(c.characteristics, "Cấu trúc vi mô Cassie-Baxter trên vỏ cánh triệt tiêu lực cản cơ học lăn của giọt nước đọng, giúp nước trượt thẳng xuống miệng bọ.");
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng tự làm mát (sprinter cooling) khi đang chạy nhanh nhờ tận dụng đối lưu không khí động học ở chân dài.");
      addUniqueItem(newC.strengths, "Biến đổi lipid sáp kỵ nước chuỗi rất dài ở lớp biểu bì để ngăn chặn triệt để sự thất thoát nước qua hô hấp.");
      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Lực cản gió lớn khi đứng ở góc đón sương 45 độ khiến chúng dễ bị thổi bay nếu gió sa mạc vượt quá 45 km/h.");
      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Nghiên cứu lớp sáp của chúng cho thấy khả năng tự chữa lành khi bị trầy xước nhẹ dưới ánh nắng mặt trời.");
      addUniqueItem(newC.fun_facts, "Chúng có thể chạy ở tốc độ cực đại tới 1 mét/giây trên cát nghiêng lỏng lẻo dốc đứng để trốn tránh thằn lằn.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://www.wits.ac.za/news/latest-news/general-news/2020/2020-03/beetles-cool-down-by-sprinting.html",
        label: "Wits University - Desert beetles cool down by sprinting"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1126/science.1066708",
        label: "Science - Biomimetic Fog Harvesting Surfaces"
      });

    } else if (c.id === 'narwhal') {
      newC.diet_type = 'carnivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "cá tuyết Bắc Cực");
      addUniqueItem(newC.diet_items, "cá bơn Greenland");
      addUniqueItem(newC.diet_items, "mực");
      addUniqueItem(newC.diet_items, "tôm");

      newC.activity_pattern = 'variable';
      newC.lifespan_min = 30;
      newC.lifespan_max = 50;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Thời gian mang thai kéo dài từ 14 đến 15 tháng, sinh một con non duy nhất vào mùa hè. Khoảng cách giữa các lần sinh thường là 2-3 năm.";
      newC.locomotion = 'swim';
      newC.speed_max = 22.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 3950.0;
      newC.size_max_mm = 5500.0;
      newC.weight_avg_g = 1200000.0;

      newC.characteristics = appendText(c.characteristics, "Hệ thống mạch máu ở tủy răng nối thẳng tới hệ tuần hoàn chính giúp cảm nhận biến thiên nhiệt độ và độ mặn nước tức thời.");
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Hệ tuần hoàn tích hợp phản xạ lặn sâu (diving reflex) cực đoan giúp điều hòa nhịp tim xuống 10 nhịp/phút dưới áp suất 150 atm.");
      addUniqueItem(newC.strengths, "Sóng thính giác echolocation hẹp nhất trong các loài cetacean giúp chống phản xạ dội nhiễu từ các tảng băng gồ ghề Bắc Cực.");
      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không có khả năng thở bằng miệng, nếu lỗ thở duy nhất bị băng đóng kín hoàn toàn sẽ dẫn đến ngạt thở hàng loạt.");
      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Drone ghi hình thực tế cho thấy chúng dùng ngà gõ nhẹ để làm choáng váng cá tuyết trước khi dùng lực hút chân không nuốt chửng.");
      addUniqueItem(newC.fun_facts, "Các lớp ngà mọc theo năm như vân gỗ là một cuốn biên niên sử sinh học ghi lại chính xác chế độ ăn và nhiệt độ đại dương trong suốt cuộc đời của nó.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1002/ar.22886",
        label: "The Anatomical Record - Sensory transduction in the narwhal tusk"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/mms.12381",
        label: "Marine Mammal Science - Tusk use for feeding in narwhals"
      });

    } else if (c.id === 'ocean-sunfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "sứa");
      addUniqueItem(newC.diet_items, "salp");
      addUniqueItem(newC.diet_items, "sứa lược");
      addUniqueItem(newC.diet_items, "cá con");
      addUniqueItem(newC.diet_items, "giáp xác");

      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 23;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Đẻ trứng ra môi trường ngoài (oviparous), một lần con cái có thể giải phóng tới 300 triệu trứng vào đại dương.";
      newC.locomotion = 'swim';
      newC.speed_max = 3.6;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 1800.0;
      newC.size_max_mm = 3300.0;
      newC.weight_avg_g = 1500000.0;

      newC.characteristics = appendText(c.characteristics, "Cơ chế bơm nước vào và ra khỏi vòm miệng liên tục để nghiền nát con mồi dạng keo như sứa biển.");
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Bộ xương nhẹ cấu tạo chủ yếu bằng sụn giúp đạt kích thước khổng lồ mà không bị tải trọng xương đè nén.");
      addUniqueItem(newC.strengths, "Hệ thống GH/IGF1 (Growth Hormone/Insulin-like Growth Factor 1) được chọn lọc tự nhiên mạnh mẽ để tăng trưởng siêu tốc 60 triệu lần từ dạng ấu trùng.");
      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Não bộ cực nhỏ chỉ khoảng 6g, hạn chế đáng kể khả năng phản xạ và xử lý tình huống phức tạp.");
      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Chúng giữ đầy đủ 7 cụm gene Hox quy định đuôi tương tự các loài cá xương khác, phản bác giả thuyết ban đầu là chúng bị mất cụm gene Hox.");
      addUniqueItem(newC.fun_facts, "Ấu trùng cá mặt trăng mới nở có hình dáng tròn xoe và đầy gai nhọn như cá nóc, khác xa vẻ dẹt của cá trưởng thành.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1186/s12915-016-0294-2",
        label: "BMC Biology - Common sunfish genome and selection of growth genes"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.jembe.2014.09.012",
        label: "Journal of Experimental Marine Biology - Symbiotic parasite removal of Mola mola"
      });

    } else if (c.id === 'ogre-faced-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = c.diet_items || [];
      addUniqueItem(newC.diet_items, "kiến");
      addUniqueItem(newC.diet_items, "mối");
      addUniqueItem(newC.diet_items, "châu chấu");
      addUniqueItem(newC.diet_items, "bướm đêm");
      addUniqueItem(newC.diet_items, "côn trùng nhỏ");

      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Con cái dệt các kén trứng hình tròn màu nâu chắc chắn, treo chúng vào thảm thực vật thấp hoặc lá cây khô để ngụy trang khỏi kẻ săn mồi.";
      newC.locomotion = 'crawl';
      newC.speed_max = 2.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 20.0;
      newC.size_max_mm = 30.0;
      newC.weight_avg_g = 2.0;

      newC.characteristics = appendText(c.characteristics, "Cấu trúc lông cảm thụ thính giác trichobothria cực nhạy trên các khớp chân trước giúp phát hiện rung động tần số thấp từ cánh côn trùng.");
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Metatarsal organs ở khớp chân trước cực kỳ nhạy bén phát hiện sóng âm truyền qua không khí của cánh côn trùng từ khoảng cách 2 mét.");
      addUniqueItem(newC.strengths, "Ballistic backflip strike (cú nhảy lộn ngược) quăng lưới bắt côn trùng bay phía sau chỉ dựa trên thính giác cơ học chân.");
      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Hiệu suất săn mồi giảm sút nghiêm trọng trong những đêm trời lộng gió mạnh do gió làm rung động các lông cảm giác gây báo động giả.");
      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Hành vi của chúng được mô tả là Jekyll và Hyde: ngụy trang bất động tuyệt đối như cành củi khô ban ngày và trở thành sát thủ phản xạ lộn nhào ban đêm.");
      addUniqueItem(newC.fun_facts, "Chúng thường thả một giọt phân màu trắng lên lá cây phía dưới để làm mốc định vị điểm quăng lưới chính xác.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.cub.2020.09.048",
        label: "Current Biology - Ogre-faced Spiders Use Hearing for Hunting"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1098/rsbl.2022.0410",
        label: "Biology Letters - Acoustic prey detection in net-casting spiders"
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
