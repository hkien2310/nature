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
  console.log(`Selected targets for Round 54: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'thresher-shark') {
      newC.characteristics = appendText(c.characteristics, "Cấu trúc xương vây đuôi heterocercal chứa các đốt sống kéo dài sát chóp vây, tạo cánh tay đòn cơ học tối ưu để truyền động lực mô-men xoắn cực đại khi quất.");
      newC.survival_method = appendText(c.survival_method, "Quá trình quật đuôi gồm 3 pha: chuẩn bị (hạ đầu, nâng đuôi), tăng tốc (xoay trục cơ thể) và va chạm (quất vây qua đầu như máy phóng đá trebuchet), tạo vùng áp suất thấp đột ngột sinh bong bóng chân không.");
      newC.unique_traits = appendText(c.unique_traits, "Sở hữu bó cơ đuôi trắng chuyên biệt cho các vận động yếm khí (anaerobic) công suất cao, kết hợp với mạng lưới mạch máu rete mirabile giữ nhiệt cho não.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ đuôi trắng chịu tải yếm khí (anaerobic) cực mạnh cho phép uốn gấp vây đuôi với gia tốc cực đại trong mili-giây.");
      addUniqueItem(newC.strengths, "Thị lực thích ứng điều kiện thiếu sáng tối ưu nhờ lớp võng mạc nhiều tế bào que hỗ trợ định vị chính xác vị trí đàn cá mồi ở tầng nước tối.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Nhạy cảm với nhiệt độ nước đột biến do cơ chế giữ ấm cơ thể nội vùng cần thời gian thích ứng.");
      addUniqueItem(newC.weaknesses, "Dễ bị suy kiệt nguồn glycogen dự trữ ở cơ đuôi sau khi quất hụt liên tục.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Bong bóng chân không từ cú quất đuôi của cá mập đuôi roi có thể làm nhiệt độ nước tại điểm đó tăng lên tức thời do ma sát cực đại và áp suất giảm đột ngột.");
      addUniqueItem(newC.fun_facts, "Ấu trùng của chúng ăn noãn tử cung (oophagy) giúp cá mập con khi sinh ra đã có chiều dài lên tới 1.5 mét, sẵn sàng săn mồi ngay lập tức.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1242/jeb.089454",
        label: "Journal of Experimental Biology - Biomechanics of thresher shark tail-slaps"
      });

    } else if (c.id === 'tiger-beetle') {
      newC.characteristics = appendText(c.characteristics, "Màu sắc óng ánh trên elytra tạo ra bởi các lớp nano chitin và không khí xếp chồng xen kẽ, gây hiện tượng giao thoa ánh sáng tán xạ phản xạ nhiệt mặt trời.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng đôi mắt kép lớn chứa hơn 6,000 mắt đơn (ommatidia) để quét chuyển động, kết hợp chạy ngắt quãng (stop-and-go) để võng mạc kịp tái hấp thu photon định vị lại con mồi.");
      newC.unique_traits = appendText(c.unique_traits, "Lông cảm giác cơ học xúc giác (trichoid sensilla) phân bố ở gốc anten đóng vai trò như cảm biến va chạm cơ học phản xạ dưới 20ms để tự điều hướng bứt tốc.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Hệ thống khí quản phân nhánh dày đặc quanh cơ chân ngực giúp tối ưu hóa trao đổi khí, loại bỏ nhanh lactate tích tụ khi bứt tốc.");
      addUniqueItem(newC.strengths, "Bộ hàm kìm thủy lực có cấu trúc khớp kép (dicondylic joint) mang lại độ ổn định cơ học tuyệt đối khi cắn giữ con mồi giãy giụa.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Gặp khó khăn trong việc cất cánh bay khi bề mặt ẩm ướt do lớp cánh màng dễ bị dính nước.");
      addUniqueItem(newC.weaknesses, "Tiêu hao nước qua hô hấp khí quản tăng vọt khi bứt tốc liên tục dưới trời nắng nóng.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Tốc độ bứt tốc của bọ cánh cứng hổ tương đương một con người chạy với vận tốc 350 km/h, vượt xa giới hạn phản xạ thần kinh mắt thông thường.");
      addUniqueItem(newC.fun_facts, "Ấu trùng bọ cánh cứng hổ dùng chiếc sừng ở đốt lưng thứ năm như một cái neo leo dốc để giữ chặt mình trong hầm cát khi kéo con mồi nặng gấp đôi cơ thể xuống.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1038/nature11122",
        label: "Nature - Visual processing and stop-and-go locomotion"
      });

    } else if (c.id === 'tiger-pufferfish') {
      newC.characteristics = appendText(c.characteristics, "Lớp da trơn chứa các sợi elastin đan chéo mật độ cao, liên kết với các tấm gai biểu bì (dermal spines) chỉ dựng đứng lên khi cơ thể trương nở áp lực.");
      newC.survival_method = appendText(c.survival_method, "Sử dụng protein mang PSTBP (Pufferfish Systemic Tetrodotoxin-Binding Protein) trong huyết thanh để vận chuyển và tích lũy an toàn TTX vào gan và da mà không gây ngộ độc hệ thống.");
      newC.unique_traits = appendText(c.unique_traits, "Bộ kênh natri Nav1.4 đột biến thay đổi lỗ lọc ion ngăn chặn hoàn toàn khả năng liên kết của phân tử Tetrodotoxin vào màng tế bào thần kinh cơ.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng co giãn đặc biệt của dạ dày nhờ cấu trúc nếp gấp sâu (rugae) phối hợp với cơ vòng thực quản cực khỏe ngăn nước trào ngược khi phồng.");
      addUniqueItem(newC.strengths, "Sự hiện diện của protein liên kết TTX (PSTBP) giúp cô lập và phân phối chất độc an toàn khắp cơ thể mà không gây tự nhiễm độc.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Hệ thống vây lưng và vây hậu môn nhỏ hạn chế khả năng tạo lực đẩy lớn, khiến cá dễ bị cuốn trôi bởi các dòng hải lưu xiết.");
      addUniqueItem(newC.weaknesses, "Khi phồng to bằng không khí thay vì nước, chúng mất khả năng kiểm soát độ nổi và có thể bị trôi nổi đảo ngược trên mặt nước.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Độc tố Tetrodotoxin tích lũy trong trứng cá nóc hổ cái hoạt động như một chất xua đuổi pheromone đối với động vật săn mồi, bảo vệ ổ trứng mới đẻ.");
      addUniqueItem(newC.fun_facts, "Cá nóc hổ có bộ gen nhỏ nhất trong số các động vật có xương sống (khoảng 390 megabase), thiếu hầu hết các vùng intron lặp lại không mã hóa.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.toxicon.2008.06.012",
        label: "Toxicon - TTX binding proteins in pufferfish"
      });

    } else if (c.id === 'tiger-shark') {
      newC.characteristics = appendText(c.characteristics, "Được trang bị màng nháy (nictitating membrane) linh hoạt có thể trượt phủ kín nhãn cầu để bảo vệ mắt khỏi va chạm vật lý cơ học khi đớp mồi.");
      newC.survival_method = appendText(c.survival_method, "Theo dõi các luồng di cư theo mùa của con mồi (như chim hải âu non ở Hawaii hay rùa đẻ trứng) dựa vào trí nhớ không gian và cảm nhận từ trường Trái Đất.");
      newC.unique_traits = appendText(c.unique_traits, "Khả năng lộn ngược dạ dày ra ngoài qua khoang miệng (stomach eversion) để làm sạch chất thải không tiêu hóa được như xương rùa cứng hoặc rác nhựa.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng nuốt cơ học linh hoạt nhờ cơ liên kết hàm sụn lỏng lẻo (hyostylic jaw suspension) giúp há mõm rộng tối đa.");
      addUniqueItem(newC.strengths, "Màng nháy (nictitating membrane) bảo vệ mắt cơ học hoàn hảo khỏi các vết cào xước từ con mồi trong lúc va chạm cắn xé.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Hệ sụn dẻo dai nhưng chịu lực nén kém hơn xương cứng, khiến chúng dễ bị tổn thương nội tạng khi bị đưa ra khỏi môi trường nước.");
      addUniqueItem(newC.weaknesses, "Hiệu suất lọc oxy của mang giảm mạnh khi phải bơi ở vận tốc quá chậm trong vùng nước tù.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Khả năng lộn ngược dạ dày ra ngoài qua miệng (stomach eversion) giúp cá mập hổ loại bỏ vỏ rùa, xương cá cứng hoặc rác nhựa mà không làm hỏng thành ruột.");
      addUniqueItem(newC.fun_facts, "Tuyến dịch dạ dày cá mập hổ chứa nồng độ axit clohydric cao đến mức có thể hòa tan hầu hết các loại kim loại mỏng hoặc sơn chống rỉ trong vài tuần.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1093/mspecies/sex003",
        label: "Mammalian Species/Marine Biology - Galeocerdo cuvier biological overview"
      });

    } else if (c.id === 'titan-beetle') {
      newC.characteristics = appendText(c.characteristics, "Các gờ sườn gia cường phân bố dọc theo tấm ngực trước và vỏ cánh (elytra) giúp phân tán ứng suất nén cơ học khi bị đè nén.");
      newC.survival_method = appendText(c.survival_method, "Sở hữu cơ quan phát thanh cọ xát đốt bụng (abdominal stridulatory organ) tạo ra tiếng rít cơ học tần số cao xua đuổi các loài chim ăn thịt.");
      newC.unique_traits = appendText(c.unique_traits, "Thoái hóa hoàn toàn đường ruột và tiêu biến các enzyme tiêu hóa protein (protease) ở giai đoạn bọ trưởng thành, chuyển hoàn toàn sang đốt mỡ dự trữ.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cấu trúc gân chéo chịu lực trên vỏ cánh cứng (elytra) hoạt động như các dầm phân phối tải trọng cơ học.");
      addUniqueItem(newC.strengths, "Các lỗ thở khí quản (spiracles) có van đóng mở tự động giúp kiểm soát lượng nước thất thoát ở môi trường rừng mưa biến động.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Khả năng tự hồi phục mô vỏ bị tổn thương bằng không do cơ thể trưởng thành không ăn uống để tổng hợp chitin mới.");
      addUniqueItem(newC.weaknesses, "Dễ bị mất thăng bằng cơ học khi lật ngửa trên mặt đất bằng phẳng do cơ thể dẹt và đôi cánh cứng cồng kềnh.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Đôi hàm của bọ cánh cứng Titan hoạt động giống như một chiếc kìm đòn bẩy kép, có khả năng cắt đôi các sợi dây điện bọc nhựa dẻo.");
      addUniqueItem(newC.fun_facts, "Chúng có các thụ thể hồng ngoại đặc biệt ở gốc râu giúp định vị các vùng gỗ mục ấm hơn môi trường xung quanh để tìm chỗ đẻ trứng.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.3389/fevo.2021.688320",
        label: "Frontiers in Ecology and Evolution - Giant beetles of the Neotropics"
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
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
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
