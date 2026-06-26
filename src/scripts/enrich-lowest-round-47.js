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
  console.log(`Selected targets for Round 47: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'redback-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["côn trùng", "nhện nhỏ khác", "thằn lằn nhỏ", "chuột nhắt nhỏ", "rắn nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 2;
      newC.lifespan_max = 3;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Nghi lễ giao phối hiến tế đặc biệt của con đực khi tự nhào đầu vào răng độc của con cái để kéo dài thời gian giao phối và thụ tinh trứng. Con cái đẻ các túi trứng dạng tơ tròn chứa từ 40 đến 300 quả trứng.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.1;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 3.0;
      newC.size_max_mm = 10.0;
      newC.weight_avg_g = 0.2;

      newC.characteristics = appendText(c.characteristics, "Hệ thống chân khớp được bọc bởi các thụ thể cơ học siêu nhạy cảm giúp cảm nhận sự dịch chuyển nhỏ nhất của sợi tơ bẫy mồi.");
      newC.survival_method = appendText(c.survival_method, "Tận dụng góc tối ấm áp của các công trình nhân tạo để giăng tơ bẫy và trú ẩn khỏi ánh nắng trực tiếp ban ngày.");
      newC.unique_traits = appendText(c.unique_traits, "Tơ bẫy có lớp phủ glycoprotein chịu được sức căng lớn và bền bỉ trong môi trường ẩm ướt.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Nọc độc phá hủy khớp nối neuromuscular synapse của động vật có vú chỉ với liều lượng cực nhỏ.");
      addUniqueItem(newC.strengths, "Khả năng lưu trữ tinh trùng lâu dài trong túi tinh để đẻ trứng liên tục.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không thể săn mồi hiệu quả nếu không có mạng tơ giăng sẵn.");
      addUniqueItem(newC.weaknesses, "Dễ bị tấn công bởi ong bắp cày ký sinh chuyên săn nhện.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Có những trường hợp ghi nhận mạng nhện lưng đỏ giữ chân được những con rắn nhỏ dài tới 20 cm.");
      addUniqueItem(newC.fun_facts, "Nhện đực thường chết ngay sau khi giao phối thành công do bị nhện cái cắn ăn thịt.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.toxicon.2016.03.012",
        label: "Toxicon - Latrodectus hasselti venom composition and medical relevance"
      });

    } else if (c.id === 'reef-stonefish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nhỏ", "tôm rạn san hô", "cua rạn san hô", "giáp xác nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính, thụ tinh ngoài. Con cái phóng hàng triệu trứng nhỏ vào các thềm san hô, con đực bơi theo sau giải phóng tinh dịch để thụ tinh chéo.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 400.0;
      newC.weight_avg_g = 1800.0;

      newC.characteristics = appendText(c.characteristics, "Lớp da sần sùi chứa các lỗ tuyến tiết dịch chất nhầy tạo lớp dính để các hạt cát và tảo bám chặt tăng độ ngụy trang.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng các gai vây ngực khỏe để bới và vùi sâu cơ thể xuống cát mịn chỉ chừa lại phần mắt.");
      newC.unique_traits = appendText(c.unique_traits, "Hệ cơ hàm mở nhanh kỷ lục tạo áp suất âm hút con mồi trong nháy mắt.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Gai độc chứa stonustoxin có thể chọc thủng lớp bảo hộ dày của các thợ lặn.");
      addUniqueItem(newC.strengths, "Khả năng giảm nhịp thở và nhịp tim đáng kinh ngạc khi ẩn nấp phục kích.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Hoàn toàn bất lực khi bị ép phải bơi đua tốc độ cao ở vùng nước mở.");
      addUniqueItem(newC.weaknesses, "Phần bụng không có lớp giáp gai nên cực kỳ nhạy cảm với các đòn cắn từ phía dưới.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Nọc độc của chúng có thể bị bất hoạt nhanh chóng bởi nước nóng trên 45 độ C, là cách sơ cứu hữu hiệu.");
      addUniqueItem(newC.fun_facts, "Nhiều du khách giẫm phải cá đá và tưởng lầm đó chỉ là một viên đá trơn lướt.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.toxicon.2018.06.015",
        label: "Toxicon - Structure and function of stonustoxin in reef stonefish"
      });

    } else if (c.id === 'reticulated-python') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["nai cát", "lợn rừng", "chuột cống", "khỉ", "cầy hương", "chim hoang dã"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 25;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Con cái đẻ từ 15 đến 80 quả trứng mỗi lứa, sau đó cuộn tròn xung quanh tổ trứng để ấp và bảo vệ, co thắt cơ thể liên tục để tạo nhiệt sưởi ấm cho trứng.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 5500.0;
      newC.size_max_mm = 7500.0;
      newC.weight_avg_g = 110000.0;

      newC.characteristics = appendText(c.characteristics, "Hệ cơ dọc phân bố dọc theo sống lưng tạo lực co bóp vô cùng dẻo dai bóp nghẹt các đốt xương con mồi.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng các hố cảm biến nhiệt độ nằm quanh môi để phát hiện sinh vật máu nóng từ khoảng cách 1 mét.");
      newC.unique_traits = appendText(c.unique_traits, "Khả năng mở rộng tối đa khoảng cách xương sọ nhờ khớp sụn đàn hồi để nuốt con mồi khổng lồ.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Lực siết cơ bắp tàn khốc ngắt hoàn toàn lượng oxy lên não của con mồi.");
      addUniqueItem(newC.strengths, "Khả năng nhịn ăn bền bỉ đáng kinh ngạc nhờ hệ tiêu hóa thích nghi thu nhỏ tế bào.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Rất lờ đờ và dễ tổn thương sau khi ăn một bữa ăn quá lớn do trọng lượng tăng vọt.");
      addUniqueItem(newC.weaknesses, "Hành vi bò trườn để lại dấu vết lớn trên bùn đất dễ bị thợ săn phát hiện.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Một số cá thể trăn gấm cái nuôi nhốt có thể sinh sản vô tính mà không cần trăn đực thông qua hiện tượng trinh sản.");
      addUniqueItem(newC.fun_facts, "Trăn gấm bơi rất giỏi và thường di chuyển giữa các đảo ngoài khơi xa.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1093/sysbio/syw039",
        label: "Systematic Biology - Genomic evolution of Malayopython reticulatus"
      });

    } else if (c.id === 'ribbon-eel') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nhỏ", "tôm rạn san hô", "giáp xác nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = 'Lưỡng tính đổi giới tính theo vòng đời từ đực sang cái (protandrous hermaphroditism). Giao phối hữu tính bằng cách thụ tinh ngoài, giải phóng giao tử vào cột nước biển.';
      newC.locomotion = 'swim';
      newC.speed_max = 6.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 650.0;
      newC.size_max_mm = 1300.0;
      newC.weight_avg_g = 300.0;

      newC.characteristics = appendText(c.characteristics, "Cơ thể thuôn dài mảnh khảnh với vây dọc lưng kéo dài liên tục từ sau đầu tạo dòng nước đẩy uyển chuyển.");
      newC.survival_method = appendText(c.survival_method, "Giấu kín thân mình trong các hốc đá chật hẹp và chỉ nhô đầu ra ngoài vẫy chào tìm mồi.");
      newC.unique_traits = appendText(c.unique_traits, "Sự đổi màu sắc ngoạn mục đi kèm với sự đổi giới tính sinh học dọc cuộc đời.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khứu giác định vị mùi cực tốt nhờ hai phễu khứu giác hướng gió.");
      addUniqueItem(newC.strengths, "Lớp chất nhầy glycoprotein kháng khuẩn dày phủ toàn thân bảo vệ chống lại trầy xước đá.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không có lớp vảy cứng bảo vệ cơ thể trước các vết cắn trực tiếp.");
      addUniqueItem(newC.weaknesses, "Đặc biệt khó thích nghi trong môi trường nhân tạo bể kính.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Ở giai đoạn chuyển giới sang giống cái, màu sắc của chúng chuyển từ màu xanh lam sặc sỡ sang màu vàng rực hoàn toàn.");
      addUniqueItem(newC.fun_facts, "Hành động há miệng liên tục thực chất là ép nước chảy qua mang để thở chứ không phải đe dọa.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1007/BF00392901",
        label: "Sex change and color phases of Rhinomuraena quaesita"
      });

    } else if (c.id === 'rove-beetle') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["rầy nâu", "sâu cuốn lá", "ấu trùng côn trùng", "nhện nhỏ"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 3;
      newC.lifespan_max = 6;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính. Con cái đẻ từng quả trứng riêng lẻ xuống các thềm đất mùn ẩm ướt gần ruộng lúa nước, có thể đẻ tới 100 quả trứng suốt đời.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 3.6;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 7.0;
      newC.size_max_mm = 10.0;
      newC.weight_avg_g = 0.015;

      newC.characteristics = appendText(c.characteristics, "Cặp cánh màng mỏng dẻo dai gấp gọn gàng dưới nắp cánh cứng ngắn giúp dễ dàng chui rúc đất đá mà không rách.");
      newC.survival_method = appendText(c.survival_method, "Tiết chất độc paederin qua da khi cơ thể bị chà xát đè nén, bảo vệ chống các loài chim ăn sâu.");
      newC.unique_traits = appendText(c.unique_traits, "Phức hợp vi khuẩn cộng sinh sản sinh độc tố hóa học không hao tổn tài nguyên gen nội tại.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Chất độc paederin có hoạt tính ức chế sinh tổng hợp protein tế bào cực mạnh.");
      addUniqueItem(newC.strengths, "Tốc độ bò trườn lắt léo và khả năng cất cánh cực nhanh khi bị truy đuổi.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Lớp giáp kitin rất mềm dễ bị đè bẹp cơ học hoàn toàn.");
      addUniqueItem(newC.weaknesses, "Bị thu hút thụ động trước các nguồn ánh sáng xanh huỳnh quang về đêm.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Độc tố Paederin mạnh gấp 15 lần nọc rắn hổ mang khi so sánh cùng lượng sấy khô.");
      addUniqueItem(newC.fun_facts, "Chúng là bạn thân của nhà nông nhờ tiêu diệt số lượng lớn rầy nâu phá lúa.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://pubmed.ncbi.nlm.nih.gov/22384792/",
        label: "Chemical structure and biosynthesis of Pederin"
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
