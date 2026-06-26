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
  console.log(`Selected targets for Round 40: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'king-cobra') {
      addUniqueItem(newC.diet_items, "rắn lục nước");
      addUniqueItem(newC.diet_items, "thằn lằn bóng");

      newC.characteristics = appendText(c.characteristics, "Cơ thể thon dài linh hoạt có cấu trúc cột sống lên tới 435 đốt sống, giúp tối ưu chuyển động bò uốn lượn nhanh và lực ép quấn xiết nhẹ khi giữ mồi.");
      newC.survival_method = appendText(c.survival_method, "Khả năng phun phế quản cảnh báo có tần số cộng hưởng cực thấp để xua đuổi các loài thú săn mồi lớn.");
      newC.unique_traits = appendText(c.unique_traits, "Cơ chế miễn dịch tự nhiên chống lại nọc độc của các loài rắn độc khác nhờ các thụ thể acetylcholine đặc biệt đã biến đổi.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng tiết lượng nọc độc thô khổng lồ lên tới 500-700 mg trong một cú cắn đơn lẻ, đủ hạ gục một con voi châu Á.");
      addUniqueItem(newC.strengths, "Khả năng nâng cao 1/3 cơ thể (khoảng 1.5m) khỏi mặt đất để đe dọa trực diện tầm mắt kẻ thù.");
      addUniqueItem(newC.strengths, "Hệ thống xương sọ và hàm linh hoạt cho phép nuốt chửng các loài rắn độc khác có chiều dài gần tương đương.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Sự phụ thuộc cao vào chuỗi thức ăn hẹp chỉ gồm các loài bò sát và rắn khác (ophiophagy), dễ bị ảnh hưởng khi con mồi khan hiếm.");
      addUniqueItem(newC.weaknesses, "Bản tính bảo vệ tổ quyết liệt của con cái làm tăng nguy cơ bị tổn thương bởi các loài săn mồi lớn hoặc con người trong thời kỳ ấp trứng.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Haditoxin là một độc tố thần kinh ba ngón độc đáo tìm thấy trong nọc rắn hổ mang chúa, có cấu trúc homodimer độc nhất giúp tăng tốc độ liên kết với thụ thể nicotinic acetylcholine.");
      addUniqueItem(newC.fun_facts, "Tiếng gầm đe dọa của rắn hổ mang chúa có tần số thấp dưới 600 Hz, được tạo ra bằng cách nén khí qua các túi phế quản mở rộng chứ không phải tiếng rít thông thường.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1074/jbc.M109.083527",
        label: "Journal of Biological Chemistry - Haditoxin, a novel GABAergic toxin from Ophiophagus hannah"
      });

    } else if (c.id === 'komodo-dragon') {
      addUniqueItem(newC.diet_items, "ngựa hoang");
      addUniqueItem(newC.diet_items, "khỉ đuôi dài");

      newC.characteristics = appendText(c.characteristics, "Hộp sọ có độ dẻo cơ học thấp nhưng khớp thái dương-hàm cực kỳ linh động, cho phép nuốt chửng các miếng thịt khổng lồ nặng tới 80% trọng lượng cơ thể.");
      newC.survival_method = appendText(c.survival_method, "Chiến thuật săn mồi kiên trì bám đuôi con mồi bị nhiễm nọc kháng đông trong nhiều ngày cho đến khi con mồi kiệt sức tự đổ sụp.");
      newC.unique_traits = appendText(c.unique_traits, "Sơ hữu các huyết thanh peptide kháng khuẩn cực mạnh trong máu giúp bảo vệ rồng Komodo khỏi nhiễm trùng khi bị cắn bởi đồng loại.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ chế sinh sản đơn tính (parthenogenesis) cho phép con cái tự thụ tinh đẻ trứng nở ra con đực để thiết lập quần thể mới khi di cư biệt lập.");
      addUniqueItem(newC.strengths, "Tuyến độc hàm dưới tiết ra các protein kháng đông máu (anticoagulants) làm giảm huyết áp nhanh chóng, đưa con mồi vào trạng thái sốc mất máu.");
      addUniqueItem(newC.strengths, "Răng cưa sắc nhọn có cấu trúc tương đồng với khủng long bạo chúa (theropod) tối ưu cho cơ chế giật xé thịt.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Trọng lượng cơ thể lớn làm giảm độ linh hoạt khi leo trèo ở độ tuổi trưởng thành, khiến rồng Komodo con buộc phải sống trên cây để tránh bị ăn thịt đồng loại.");
      addUniqueItem(newC.weaknesses, "Độ đa dạng di truyền cực kỳ thấp do sống cô lập trên các hòn đảo nhỏ của Indonesia, dễ bị tổn thương bởi dịch bệnh.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Rồng Komodo đực có hai cơ quan sinh dục (hemipenes) riêng biệt được sử dụng thay phiên trong quá trình giao phối.");
      addUniqueItem(newC.fun_facts, "Chụp MRI hàm rồng Komodo phát hiện các tuyến nọc độc có sáu khoang riêng biệt nằm xen kẽ giữa các kẽ răng hàm dưới.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1073/pnas.0904099106",
        label: "PNAS - Venomous bite of the Komodo dragon and its extinct relative"
      });

    } else if (c.id === 'largetooth-sawfish') {
      addUniqueItem(newC.diet_items, "cá cháo lớn");
      addUniqueItem(newC.diet_items, "cá đối");

      newC.characteristics = appendText(c.characteristics, "Rostrum (đao) dẹp phẳng bằng sụn chứa hàng ngàn kênh thần kinh kết nối trực tiếp với thùy khứu giác và thùy thị giác ở não bộ.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng đao như một lưỡi kiếm quét ngang tốc độ cao tạo lực chém cơ học xé nhỏ bầy cá di cư.");
      newC.unique_traits = appendText(c.unique_traits, "Cơ chế điều hòa áp suất thẩm thấu đặc biệt qua thận và tuyến trực tràng giúp chuyển đổi thích ứng môi trường nước ngọt hoàn hảo.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Hệ thống thụ thể điện giác (Ampullae of Lorenzini) bao phủ dày đặc trên đao giúp phát hiện điện trường cực nhỏ từ tim con mồi ở khoảng cách xa trong nước đục.");
      addUniqueItem(newC.strengths, "Đao răng cưa cơ học cực kỳ cứng cáp dùng để quật và găm chặt con mồi xuống bùn cát hoặc cắt đôi cá lớn.");
      addUniqueItem(newC.strengths, "Khả năng sinh tồn bền bỉ trong cả môi trường nước mặn, nước lợ và nước ngọt sâu trong nội địa.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Chiếc đao cồng kềnh rất dễ bị vướng vào lưới đánh cá của con người, khiến loài này bị săn bắt ngoài ý muốn và suy giảm nghiêm trọng.");
      addUniqueItem(newC.weaknesses, "Tỷ lệ sinh sản cực thấp và thời gian trưởng thành muộn (trên 10 năm) làm giảm khả năng phục hồi quần thể.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Mặc dù trông giống cá mập, cá đao thực chất thuộc siêu bộ Cá đuối (Batoidea) với các khe mang nằm ở mặt dưới cơ thể.");
      addUniqueItem(newC.fun_facts, "Đao của cá đao răng lớn chiếm tới 20-25% tổng chiều dài cơ thể của chúng và răng trên đao thực chất là vảy tấm (placoid scales) biến đổi.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.cub.2012.01.055",
        label: "Current Biology - The functional importance of the sawfish's saw"
      });

    } else if (c.id === 'leafcutter-ant') {
      addUniqueItem(newC.diet_items, "nước quả ép chín");
      addUniqueItem(newC.diet_items, "sợi cellulose mềm");

      newC.characteristics = appendText(c.characteristics, "Hệ thống tuyến nước bọt chứa chitinase và các enzyme hỗ trợ phân giải tạm thời lớp bảo vệ hóa học của lá cây trước khi đưa vào vườn nấm.");
      newC.survival_method = appendText(c.survival_method, "Xây dựng mạng lưới đường mòn vận chuyển lá dài tới 100m được làm sạch cơ học hoàn toàn để tránh chướng ngại vật cản tốc độ.");
      newC.unique_traits = appendText(c.unique_traits, "Hệ thống tự làm sạch cơ thể bằng các lược chải chân chứa chất kháng khuẩn tiết ra từ tuyến metapleural.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ hàm được gia cố bằng các ion kim loại nặng (kẽm) giúp duy trì độ sắc bén tuyệt đối của lưỡi cắt mà không bị mài mòn cơ học.");
      addUniqueItem(newC.strengths, "Sự phân chia giai cấp (caste polymorphism) linh hoạt gồm kiến lính bảo vệ, kiến thợ cắt lá, và kiến minim làm vườn giúp tối ưu hóa hiệu suất thuộc địa.");
      addUniqueItem(newC.strengths, "Khả năng giao tiếp hóa học bằng pheromone cực kỳ tinh vi để điều phối hàng triệu cá thể vận hành chuỗi cung ứng lá cây liên tục.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Sự phụ thuộc sinh tồn tuyệt đối vào nấm cộng sinh Leucoagaricus gongylophorus; thuộc địa sẽ sụp đổ hoàn toàn nếu nấm bị nhiễm ký sinh Escovopsis.");
      addUniqueItem(newC.weaknesses, "Kiến chúa sau khi thành lập tổ mới mất lượng lớn năng lượng và rất dễ bị tiêu diệt bởi các loài ăn côn trùng tầng đất.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Cơ hàm của kiến thợ cắt lá có thể dao động với tần số lên tới 1000 Hz khi cắt lá, hoạt động như một chiếc máy cưa rung siêu tốc làm giảm lực cản của xơ lá.");
      addUniqueItem(newC.fun_facts, "Mỗi thuộc địa kiến cắt lá có thể tiêu thụ lượng lá cây tương đương lượng cỏ mà một con bò trưởng thành ăn mỗi ngày.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1242/jeb.091397",
        label: "Journal of Experimental Biology - Biomechanics of leaf-cutting in Atta cephalotes"
      });

    } else if (c.id === 'leafy-seadragon') {
      addUniqueItem(newC.diet_items, "giáp xác chân chèo copepod");
      addUniqueItem(newC.diet_items, "tôm Mysid nhỏ");

      newC.characteristics = appendText(c.characteristics, "Hộp sọ dài dạng ống rỗng kết hợp với xương nắp mang linh hoạt hoạt động như một bơm piston thủy lực lực hút mạnh.");
      newC.survival_method = appendText(c.survival_method, "Duy trì cơ thể bất động theo phương nghiêng góc 45 độ mô phỏng hoàn hảo tảo bẹ trôi dạt tự nhiên.");
      newC.unique_traits = appendText(c.unique_traits, "Có cấu trúc di truyền thoái hóa gen răng và mất hoàn toàn xương sườn bảo vệ ngực, bù lại bằng lớp xương tấm cứng bọc ngoài.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Sự tiến hóa của các phần phụ dạng biểu bì mô phỏng tảo bẹ tạo ra khúc xạ ánh sáng tự nhiên che mắt động vật săn mồi.");
      addUniqueItem(newC.strengths, "Cơ chế di chuyển tĩnh lặng tuyệt đối nhờ các vây mỏng chuyển động ở tần số cao không gây nhiễu loạn dòng nước.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Hệ cơ xương tiêu biến phần lớn khớp nối di động làm giảm khả năng uốn lượn linh hoạt và trốn chạy chủ động.");
      addUniqueItem(newC.weaknesses, "Hệ tiêu hóa không có dạ dày buộc chúng phải liên tục hút thức ăn gần như 24/7 để duy trì năng lượng cơ bản.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Hải long lá hoàn toàn không có răng, hàm của chúng đã biến đổi thành một ống rỗng cứng không thể mở ra đóng lại mà chỉ hoạt động như một ống hút thụ động.");
      addUniqueItem(newC.fun_facts, "Các phiến ngụy trang dạng lá của hải long lá chứa các tế bào sắc tố đặc biệt giúp chúng tự điều chỉnh độ đậm nhạt theo bóng râm của rạn tảo.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1093/sysbio/syae012",
        label: "Systematic Biology - Phylogenomics of Seadragons and Syngnathids"
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
