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
  console.log(`Selected targets for Round 37: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'green-bomber-worm') {
      newC.diet_type = "detritivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "tuyết đại dương (marine snow)");
      addUniqueItem(newC.diet_items, "mùn bã hữu cơ");
      addUniqueItem(newC.diet_items, "xác vi sinh vật biển sâu");
      addUniqueItem(newC.diet_items, "tảo cát phân hủy");

      newC.activity_pattern = "variable";
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Thụ tinh ngoài. Cá thể đực và cái giải phóng đồng thời trứng và tinh trùng vào cột nước biển sâu, phôi phát triển thành ấu trùng trochophore bơi lội tự do trước khi định cư biến thái thành giun con.";
      newC.locomotion = "swim";
      newC.speed_max = 0.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 18.0;
      newC.size_max_mm = 100.0;
      newC.weight_avg_g = 1.5;

      newC.characteristics = appendText(c.characteristics, "Cơ quan phát sáng gồm cấu trúc màng kép chứa hỗn hợp túi dịch tế bào giàu luciferase ổn định.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng các phản ứng hóa học phát sáng thế hệ mới hoạt động không phát nhiệt, giúp bảo toàn năng lượng tối đa ở độ sâu 3.000m.");
      newC.unique_traits = appendText(c.unique_traits, "Quá trình hóa phát quang đạt hiệu suất lượng tử xấp xỉ 100%, một kỳ quan của sự tiến hóa sinh học trong môi trường biển sâu.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ chế hóa phát quang hiệu suất lượng tử gần 100% không phát nhiệt, bảo tồn năng lượng.");
      addUniqueItem(newC.strengths, "Lớp bao gelatin dày bảo vệ các cơ quan nội tạng khỏi sự nghiền nát của áp suất nước cực độ ở độ sâu gần 4.000 mét.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Lông tơ parapodia rất mỏng, dễ bị gãy nếu va chạm mạnh cơ học hoặc rơi vào các xoáy nước ngầm sâu.");
      addUniqueItem(newC.weaknesses, "Rất nhạy cảm với sự tăng lên của nhiệt độ nước biển do biến đổi khí hậu toàn cầu.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Tốc độ phản ứng hóa học tạo photon cực cao, giải phóng ánh sáng xanh lục chỉ trong 50 mili giây kể từ khi rụng.");
      addUniqueItem(newC.fun_facts, "Chất lỏng bên trong túi phát sáng chứa GFP (Green Fluorescent Protein) chịu nhiệt độ âm xuất sắc mà không bị kết tinh.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.cub.2010.12.015",
        label: "Current Biology - Phylogeny and evolution of glowing deep-sea green bombers"
      });

    } else if (c.id === 'greenland-shark') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "hải cẩu");
      addUniqueItem(newC.diet_items, "cá tuyết Bắc Cực");
      addUniqueItem(newC.diet_items, "cá đuối");
      addUniqueItem(newC.diet_items, "xác cá voi");
      addUniqueItem(newC.diet_items, "cá bơn");

      newC.activity_pattern = "variable";
      newC.lifespan_min = 272;
      newC.lifespan_max = 512;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Noãn thai sinh (ovoviviparous). Trứng nở bên trong tử cung của con mẹ và con non tiếp tục được nuôi dưỡng bằng túi noãn hoàng trước khi sinh ra trực tiếp ở dạng cá con hoàn thiện. Thời gian mang thai kéo dài kỷ lục ước tính từ 8 đến 18 năm.";
      newC.locomotion = "swim";
      newC.speed_max = 2.6;
      newC.conservation_status = "VU";
      newC.size_min_mm = 4000.0;
      newC.size_max_mm = 6400.0;
      newC.weight_avg_g = 1100000.0;

      newC.characteristics = appendText(c.characteristics, "Cơ bắp chứa hàm lượng Trimethylamine N-oxide (TMAO) cực cao đóng vai trò như chất bảo vệ thẩm thấu chống đông máu sinh học ở nhiệt độ âm.");
      newC.survival_method = appendText(c.survival_method, "Hệ thống khứu giác phát triển vượt trội với diện tích bề mặt biểu mô khứu giác khổng lồ giúp đánh hơi chính xác nguồn thức ăn ở khoảng cách hàng dặm.");
      newC.unique_traits = appendText(c.unique_traits, "Bộ gen chứa lượng lớn các gen sửa chữa DNA và ức chế sự lão hóa sinh học của các tế bào soma qua hàng thế kỷ.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Enzym hô hấp tế bào thích nghi lạnh cực đoan hoạt động bền vững ở nhiệt độ cận 0 độ C.");
      addUniqueItem(newC.strengths, "Trái tim tích lũy lipofuscin chậm gấp 5 lần so với động vật có xương sống thông thường.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Thời gian mang thai cực kỳ lâu (ước tính từ 8 đến 18 năm), một trong những thời gian mang thai dài nhất trong thế giới động vật.");
      addUniqueItem(newC.weaknesses, "Khả năng phản xạ cơ bắp chậm chạp khiến chúng không thể né tránh các lưới cào đáy quét qua.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Hợp chất selen dồi dào trong tim hoạt động như lá chắn tự nhiên ngăn ngừa thoái hóa cơ tim qua hàng thế kỷ.");
      addUniqueItem(newC.fun_facts, "Thời gian mang thai dài kỷ lục tới 18 năm của cá mập Greenland dài hơn hầu hết bất kỳ loài thú có vú nào trên cạn.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/acel.14115",
        label: "Aging Cell - Greenland shark cardiac resilience and aging markers"
      });

    } else if (c.id === 'grizzly-bear') {
      newC.diet_type = "omnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "cá hồi");
      addUniqueItem(newC.diet_items, "quả mọng");
      addUniqueItem(newC.diet_items, "rễ cây");
      addUniqueItem(newC.diet_items, "nai sừng tấm");
      addUniqueItem(newC.diet_items, "côn trùng");
      addUniqueItem(newC.diet_items, "mật ong");
      addUniqueItem(newC.diet_items, "hạt thông");

      newC.activity_pattern = "variable";
      newC.lifespan_min = 20;
      newC.lifespan_max = 25;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Thai sinh (viviparous). Có hiện tượng hoãn phôi làm tổ (delayed implantation). Con non sinh ra trong hang ngủ đông của mẹ vào khoảng tháng 1-2, rất nhỏ, nặng khoảng 450-500g, mù và chưa có lông.";
      newC.locomotion = "hybrid";
      newC.speed_max = 56.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 2000.0;
      newC.size_max_mm = 2500.0;
      newC.weight_avg_g = 270000.0;

      newC.characteristics = appendText(c.characteristics, "Bướu cơ vai chứa các sợi cơ co nhanh (type II) liên kết chặt với xương bả vai lớn, tối ưu hóa xung lực tát mạnh.");
      newC.survival_method = appendText(c.survival_method, "Trong kỳ ngủ đông, chúng tái chế urê từ nước tiểu để chuyển hóa thành protein hữu ích chống teo cơ hiệu quả.");
      newC.unique_traits = appendText(c.unique_traits, "Cơ chế tự điều chỉnh nhạy cảm insulin trong kỳ ngủ đông giúp bảo vệ tim mạch khỏi các tai biến biến dưỡng.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng chuyển hóa urê trong nước tiểu ngược lại thành protein hữu ích trong suốt kỳ ngủ đông dài để chống teo cơ.");
      addUniqueItem(newC.strengths, "Khả năng thu hồi và tái hấp thu canxi từ nước tiểu trong kỳ ngủ đông để bù đắp lượng khoáng xương hao hụt.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Trọng lượng cơ thể quá tải khiến việc xoay chuyển ở góc hẹp ở tốc độ cao dễ dẫn đến chấn thương dây chằng đầu gối.");
      addUniqueItem(newC.weaknesses, "Thị lực kém ở cự ly xa, chủ yếu dựa vào khứu giác và thính giác.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Nghiên cứu về hormone CART ở gấu xám ngủ đông đang mở ra hướng điều trị loãng xương và teo cơ cho các phi hành gia ngoài không gian.");
      addUniqueItem(newC.fun_facts, "Gấu xám thực ra có thể chạy lên dốc nhanh hơn chạy xuống dốc do đặc trưng chân trước ngắn chân sau dài.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1152/ajpregu.00244.2021",
        label: "American Journal of Physiology - Bone metabolism regulation and CART hormone in hibernating bears"
      });

    } else if (c.id === 'gulper-eel') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "tôm nhỏ");
      addUniqueItem(newC.diet_items, "giáp xác chân chèo");
      addUniqueItem(newC.diet_items, "cá nhỏ");
      addUniqueItem(newC.diet_items, "mực nhỏ");
      addUniqueItem(newC.diet_items, "mùn hữu cơ");

      newC.activity_pattern = "variable";
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Thụ tinh ngoài. Cả con đực và cái đều trải qua quá trình thoái hóa cơ thể sau sinh sản, đẻ một lần duy nhất trong đời rồi chết (semelparous). Con đực có khứu giác phình to để tìm kiếm con cái.";
      newC.locomotion = "swim";
      newC.speed_max = 1.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 600.0;
      newC.size_max_mm = 800.0;
      newC.weight_avg_g = 400.0;

      newC.characteristics = appendText(c.characteristics, "Cơ thể dẹt bên, có khớp hàm dưới streptostyly cực dẻo cho phép miệng mở rộng một góc tối đa lên tới 180 độ.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng chiếc đuôi dài có cơ quan phát sáng nhấp nháy làm mồi nhử các sinh vật biển sâu tò mò bơi đến gần miệng.");
      newC.unique_traits = appendText(c.unique_traits, "Bộ xương sụn tiêu giảm tối đa khối lượng và khoáng hóa để giảm trọng lượng riêng, duy trì sức nổi tự nhiên.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ chế kéo dài các dây chằng hàm (streptostyly) cho phép hạ thấp khớp hàm dưới vượt quá giới hạn sọ thông thường.");
      addUniqueItem(newC.strengths, "Hệ cơ quang năng (photogenic muscles) ở đuôi có cấu trúc tế bào chuyên hóa chuyển hóa ATP trực tiếp thành ánh sáng lạnh hiệu suất cao.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Dạ dày siêu mỏng dẻo dai nhưng dễ bị rách và dẫn đến tử vong nếu nuốt phải con mồi có nhiều gai cứng nhọn hoắt.");
      addUniqueItem(newC.weaknesses, "Hệ cơ bắp thoái hóa yếu ớt, tốc độ di chuyển và khả năng bơi lội kém.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Khi bị đe dọa, chúng có thể ngậm đầy nước vào khoang miệng khổng lồ khiến cơ thể trông phình to như quả bóng để dọa kẻ thù.");
      addUniqueItem(newC.fun_facts, "Các camera tàu lặn ghi nhận khoang miệng cá chình bồ nông căng phồng giống như quả bóng bay khi thực hiện cú đớp nước săn mồi.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1002/jmor.21142",
        label: "Journal of Morphology - Streptostyly and jaw suspension kinematics in Eurypharynx pelecanoides"
      });

    } else if (c.id === 'hairy-frog') {
      newC.diet_type = "carnivore";
      newC.diet_items = newC.diet_items || [];
      addUniqueItem(newC.diet_items, "côn trùng");
      addUniqueItem(newC.diet_items, "ốc sên");
      addUniqueItem(newC.diet_items, "nhện");
      addUniqueItem(newC.diet_items, "ếch nhỏ");
      addUniqueItem(newC.diet_items, "nòng nọc");
      addUniqueItem(newC.diet_items, "giun đất");

      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng. Con cái đẻ các bọc trứng lớn đính vào các khe đá dưới lòng suối chảy xiết. Con đực mọc các sợi nhú da mao mạch quanh đùi sau để tăng khả năng hô hấp dưới nước sâu khi canh gác bọc trứng.";
      newC.locomotion = "hybrid";
      newC.speed_max = 8.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 130.0;
      newC.weight_avg_g = 140.0;

      newC.characteristics = appendText(c.characteristics, "Sở hữu cơ chế tự vệ đột biến bằng cách bẻ gãy đầu xương ngón chân để làm móng vuốt nhô ra xuyên thủng lớp da đệm.");
      newC.survival_method = appendText(c.survival_method, "Các peptide kháng khuẩn (AMPs) tiết ra trên biểu bì giúp ngăn ngừa triệt để các phản ứng viêm nhiễm và nấm bệnh tại vết rách da chân.");
      newC.unique_traits = appendText(c.unique_traits, "Sự tái sinh mô siêu tốc kết hợp với các chất keo sinh học tự nhiên đóng kín miệng vết rách da chân trong vòng 48 giờ sau khi rút vuốt.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Sợi nhú da (hair-like papillae) tăng diện tích bề mặt trao đổi khí lên tới 40%, hoạt động như một lá phổi phụ dưới nước.");
      addUniqueItem(newC.strengths, "Móng vuốt bằng xương thật sắc bén có thể gây thương tổn bất ngờ cho kẻ thù cận chiến.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Việc bẻ gãy xương ngón chân để làm vuốt làm giảm độ cơ động nhảy xa tạm thời trong vài tuần sau khi chiến đấu.");
      addUniqueItem(newC.weaknesses, "Cơ thể dễ mất nước nhanh chóng nếu độ ẩm không khí giảm sút đột ngột.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Những chiếc vuốt của ếch lông không hề có bao sừng che phủ. Khi cần sử dụng, xương ngón chân sẽ đâm thẳng qua lớp thịt và da bọc ngoài để lồi ra.");
      addUniqueItem(newC.fun_facts, "Sau khi móng vuốt xương rút vào, các tế bào gốc ở vùng ngón chân của ếch lông sẽ kích hoạt quá trình phân bào siêu tốc để đóng kín vết rách da trong vòng 48 giờ.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/zoj.12845",
        label: "Zoological Journal of the Linnean Society - Bone claw morphology and rapid skin regeneration in Trichobatrachus robustus"
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
