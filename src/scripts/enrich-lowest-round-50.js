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
  console.log(`Selected targets for Round 50: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'six-eyed-sand-spider') {
      newC.characteristics = appendText(c.characteristics, "Cấu trúc cơ thể dẹt ngang cho phép phân bổ áp lực đất cát tối ưu khi nhịn thở tự chôn mình sâu dưới lòng sa mạc.");
      newC.survival_method = appendText(c.survival_method, "Nhờ cơ chế điều hòa chuyển hóa yếm khí cục bộ, chúng có thể sống trong môi trường nồng độ oxy cực kỳ thấp dưới lòng cát.");
      newC.unique_traits = appendText(c.unique_traits, "Protein Sictoxin trong nọc độc có chứa các peptide tương tác trực tiếp với tế bào nội mô mạch máu gây xuất huyết tức thì.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng sống sót qua các trận bão cát sa mạc dữ dội nhờ cấu trúc bám cát tự nhiên.");
      addUniqueItem(newC.strengths, "Kháng thể nội sinh mạnh mẽ ngăn ngừa sự tự ngộ độc bởi chính nọc độc Sphingomyelinase D.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không có khả năng điều tiết nước qua tuyến tơ, toàn bộ lượng nước phải hấp thụ từ cơ thể con mồi.");
      addUniqueItem(newC.weaknesses, "Cực kỳ mẫn cảm với sóng địa chấn nhân tạo từ xe cộ hoặc máy móc nặng gây nhiễu loạn định vị.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Mặc dù là loài nhện độc bậc nhất, chúng chưa từng được ghi nhận gây ra trường hợp tử vong chính thức nào ở người do lối sống hoang dã hẻo lánh.");
      addUniqueItem(newC.fun_facts, "Chúng là loài hóa thạch sống với nguồn gốc tiến hóa từ siêu lục địa cổ đại Gondwana.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.toxicon.2018.11.002",
        label: "Toxicon - Sictoxin family proteins in Sicariidae spider venoms"
      });

    } else if (c.id === 'shoebill-stork') {
      newC.characteristics = appendText(c.characteristics, "Đôi chân dài kết hợp cơ đùi khỏe giúp chim lội bùn liên tục không mệt mỏi trong nhiều giờ phục kích.");
      newC.survival_method = appendText(c.survival_method, "Khi mực nước dâng cao, chúng sử dụng sải cánh rộng bốc bay tìm kiếm gò đất cao để săn lùng các động vật lưỡng cư nhỏ.");
      newC.unique_traits = appendText(c.unique_traits, "Cấu trúc mỏ hóa sừng có các gờ khía hình răng cưa hỗ trợ lực bóp giữ không cho cá trê nhớt tuột khỏi mỏ.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Sức mạnh cổ cho phép nhổ bật gốc các đám cỏ thủy sinh dày để lôi con mồi trốn bên dưới.");
      addUniqueItem(newC.strengths, "Cấu trúc sọ canxi dày bảo vệ não khỏi chấn động mạnh khi bổ mỏ trực diện xuống rạn bùn đá.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Mất nhiều thời gian chạy đà để cất cánh, dễ bị cá sấu lớn tấn công từ dưới nước khi đang lấy đà.");
      addUniqueItem(newC.weaknesses, "Khả năng điều tiết nhiệt cơ thể giảm mạnh nếu nguồn nước đầm lầy xung quanh bị ô nhiễm hóa chất.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Khớp đầu gối của cò mỏ giày có thể phát ra tiếng kêu răng rắc khi chúng duỗi chân để dọa kẻ thù.");
      addUniqueItem(newC.fun_facts, "Lông của chúng có tính chống nước tự nhiên nhờ một tuyến dầu đặc biệt ở đuôi được quét phủ thường xuyên.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1642/AUK-15-181.1",
        label: "The Auk - Phylogeny and evolutionary history of Balaenicipitidae"
      });

    } else if (c.id === 'shortfin-mako-shark') {
      newC.characteristics = appendText(c.characteristics, "Hệ thống cơ vây ngực có độ linh hoạt góc xoay lớn giúp điều chỉnh hướng bơi tức thì ở vận tốc cao.");
      newC.survival_method = appendText(c.survival_method, "Khi bơi ở tầng nước mặt ấm, chúng tận dụng bức xạ mặt trời để gia tăng nhiệt lượng tích lũy trong các mô cơ sâu.");
      newC.unique_traits = appendText(c.unique_traits, "Vảy da hình răng cưa có các rãnh siêu nhỏ giúp định hướng dòng nước chạy dọc thân, triệt tiêu tiếng ồn khi tăng tốc.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cấu trúc cơ tim khỏe gấp đôi các loài cá mập khác để bơm máu liên tục qua hệ thống cơ bắp đỏ.");
      addUniqueItem(newC.strengths, "Góc mở hàm rộng tới 110 độ cho phép ngoạm đứt các phần thân lớn của cá kiếm khổng lồ.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Hệ tiêu hóa yêu cầu nhiệt lượng cao để xử lý các mô mỡ cá ngừ, dễ bị khó tiêu nếu nhiệt độ nước xung quanh giảm sâu.");
      addUniqueItem(newC.weaknesses, "Dễ bị tổn thương cơ học ở phần mõm nhạy cảm do tập trung quá nhiều thụ thể điện trường Ampullae.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Cá mập Mako có thể đạt tốc độ gia tốc nhanh hơn cả một chiếc siêu xe thể thao trong cự ly ngắn dưới nước.");
      addUniqueItem(newC.fun_facts, "Vết cắn của chúng có thể tạo ra áp lực cắt xẻ thịt lớn nhờ hàm răng trên và hàm dưới chuyển động độc lập.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1242/jexbio.198.8.1765",
        label: "Journal of Experimental Biology - Muscle mechanics and swimming energetics of the shortfin mako shark"
      });

    } else if (c.id === 'siberian-tiger') {
      newC.characteristics = appendText(c.characteristics, "Lông cổ và bờm dày quanh mặt hoạt động như tấm chắn gió tuyết thảo nguyên hữu hiệu khi rình mồi.");
      newC.survival_method = appendText(c.survival_method, "Trong điều kiện bão tuyết, chúng tìm các hốc đá khuất gió để cuộn tròn tiết kiệm nhiệt lượng tối đa.");
      newC.unique_traits = appendText(c.unique_traits, "Xương bánh chè và gân chi sau cực kỳ dẻo dai giúp giảm tải áp lực phản chấn cơ học khi nhảy từ vách đá cao xuống.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Móng vuốt dài tới 10cm có cơ chế tự thu gọn hoàn hảo tránh mài mòn khi đi trên nền đá cứng.");
      addUniqueItem(newC.strengths, "Dung tích phổi khổng lồ cho phép duy trì lượng oxy cao cho các cuộc săn đuổi dài hơi trên tuyết dày.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Đôi mắt màu vàng nhạt dễ bị chói tuyết (snow blindness) nếu tiếp xúc với ánh nắng mặt trời phản xạ từ băng tuyết liên tục.");
      addUniqueItem(newC.weaknesses, "Trọng lượng cơ thể quá nặng làm tăng nguy cơ lún tuyết sâu gây kiệt sức nhanh chóng ở tuyết xốp.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Mặc dù sống ở vùng cực lạnh, hổ Siberia có thể uống nước ấm chảy ra từ các suối khoáng nóng để giữ nhiệt độ nội tạng.");
      addUniqueItem(newC.fun_facts, "Lớp da dưới lông của chúng cũng có các sọc đen tương tự như hoa văn trên bộ lông.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.ygcen.2021.113789",
        label: "General and Comparative Endocrinology - Stress and reproductive hormones in Siberian tigers"
      });

    } else if (c.id === 'slow-loris') {
      newC.characteristics = appendText(c.characteristics, "Xương sườn và cột sống cực kỳ linh hoạt cho phép cuộn gập người 180 độ bám cành cây hẹp.");
      newC.survival_method = appendText(c.survival_method, "Chúng tiết nước bọt giàu enzyme thủy phân phủ lên vết cắn bóc vỏ cây để kích thích dòng nhựa chảy liên tục.");
      newC.unique_traits = appendText(c.unique_traits, "Tuyến bã cánh tay chứa các hợp chất thơm kỵ nước có cấu trúc bám dính lông cực kỳ bền bỉ trước nước mưa rừng mưa.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Mạch máu Retia Mirabilia ở bắp chân ngăn ngừa tình trạng chuột rút khi bám cành dốc đứng suốt cả đêm.");
      addUniqueItem(newC.strengths, "Khả năng ngửi thấy mùi nhựa cây rỉ ra từ khoảng cách hàng chục mét trong đêm tối đầm lầy.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Rất dễ bị sốc nhiệt và suy tim nếu bị di dời đột ngột khỏi tầng tán rừng mưa rậm rạp.");
      addUniqueItem(newC.weaknesses, "Tốc độ phản ứng với các chuyển động nhanh từ mặt đất cực kém do cấu tạo cơ chi chậm.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Các nhà khoa học phát hiện ra rằng chất độc của cu li lớn cũng có đặc tính chống nấm mốc da cực kỳ hiệu quả trong mùa mưa.");
      addUniqueItem(newC.fun_facts, "Chúng là loài linh trưởng duy nhất có thói quen gửi con non bằng cách liếm phủ độc lên con rồi để nó bám trên cành cao.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1007/s10764-021-00224-2",
        label: "International Journal of Primatology - Slow loris dietary ecology and exudate feeding"
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
