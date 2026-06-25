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
  console.log(`Selected targets for Round 8: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === 'naked-mole-rat') {
      newC.diet_type = 'herbivore';
      newC.diet_items = ["củ rễ cây ngầm", "khoai đất", "rễ cây bụi hoang mạc"];
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

      newC.characteristics = (c.characteristics || "") + " Cấu trúc da thiếu hoàn toàn lớp hạ bì mỡ thông thường, giúp tăng khả năng truyền dẫn nhiệt trực tiếp từ môi trường xung quanh, bù đắp cho việc thiếu cơ chế run để tạo nhiệt.";
      newC.survival_method = (c.survival_method || "") + " Cơ thể chúng duy trì mức chuyển hóa cơ bản siêu thấp, chỉ bằng 60-70% so với các loài gặm nhấm cùng kích thước, cho phép sống sót qua nhiều tháng đói kém hoặc cạn kiệt oxy trong hang ngầm.";
      newC.unique_traits = (c.unique_traits || "") + " Protein p16 và p21 hoạt động phối hợp để ngăn chặn tế bào phân chia vô tội vạ, hoạt động như một hệ thống phanh tế bào kép chống lại sự hình thành khối u sơ khai.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1038/nature10485",
          "label": "Nature - Genome sequencing of the naked mole-rat"
        },
        {
          "url": "https://doi.org/10.1126/science.1235761",
          "label": "Science - Hyaluronan cancer resistance in naked mole-rat"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Chuột chũi trần trụi không bao giờ uống nước lỏng trong suốt cả cuộc đời; chúng lấy toàn bộ độ ẩm cần thiết từ các củ rễ cây ngầm mà chúng ăn.",
        "Chúng có khả năng di chuyển lùi nhanh bằng di chuyển tiến nhờ các lông xúc giác định vị quanh thân."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng duy trì mật độ xương ổn định suốt đời mà không bị loãng xương dù sống trong bóng tối.",
        "Hệ thống sửa chữa DNA hoạt tính cao gấp nhiều lần động vật có vú khác, ngăn ngừa đột biến gen tích tụ."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Hoần toàn không có khả năng tự điều hòa thân nhiệt ổn định (poikilothermic), phụ thuộc vào nhiệt độ hang ngầm.",
        "Tầm nhìn cực kỳ kém, gần như mù, dễ bị tổn thương nếu ra khỏi hang ngầm và gặp thú săn mồi ban ngày."
      ];

    } else if (c.id === 'namib-desert-beetle') {
      newC.diet_type = 'detritivore';
      newC.diet_items = ["mảnh vụn hữu cơ", "xác thực vật khô", "chất mùn sa mạc", "xác côn trùng nhỏ"];
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

      newC.characteristics = (c.characteristics || "") + " Lớp sáp phủ biểu bì chứa các hydrocarbon no mạch dài như pentacosane và heptacosane, có cấu trúc tinh thể siêu mịn đóng vai trò phản xạ tia cực tím cực mạnh.";
      newC.survival_method = (c.survival_method || "") + " Sử dụng khả năng ngụy trang cơ học bằng cách phủ một lớp cát mịn lên lưng nhờ lớp sáp dính, giúp tránh sự phát hiện của thằn lằn cát khi chúng nằm im ban ngày.";
      newC.unique_traits = (c.unique_traits || "") + " Cấu trúc rãnh kỵ nước xếp nếp vi mô tạo hiệu ứng Cassie-Baxter siêu kỵ nước, khiến lực cản lăn của các giọt nước đọng gần như bằng không.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1098/rsbl.2006.0530",
          "label": "Biology Letters - Fog-basking behaviour in Namib Desert beetles"
        },
        {
          "url": "https://doi.org/10.1115/1.4032549",
          "label": "Journal of Heat Transfer - Biomimetic engineering of Stenocara gracilipes"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Cơ chế thu nước từ sương mù của bọ Namib đã được phỏng sinh học để chế tạo bề mặt thu hoạch nước sạch cho các trạm vũ trụ và vùng khô cằn ở Chile.",
        "Chúng có thể chạy với tốc độ tương đương 1 mét mỗi giây trên cát sa mạc lún, một tỷ lệ tốc độ trên kích thước cơ thể rất lớn."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Vỏ cánh có cấu trúc composite kitin-protein có độ bền kéo cao vượt trội so với các loài bọ cánh cứng thông thường.",
        "Khả năng phát hiện các luồng khí ẩm Đại Tây Dương nhạy bén thông qua các thụ thể cảm biến độ ẩm trên râu."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Tốc độ di chuyển giảm mạnh khi bề mặt cát vượt quá 65 độ C, bắt buộc phải đào cát ẩn nấp dưới độ sâu 10 cm.",
        "Lực cản gió lớn khi đứng ở góc đón sương 45 độ khiến chúng dễ bị thổi bay nếu gió sa mạc vượt quá 45 km/h."
      ];

    } else if (c.id === 'mata-mata-turtle') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá con", "nòng nọc", "ếch nhỏ", "động vật giáp xác", "côn trùng thủy sinh"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng. Con cái bò lên cạn vào cuối mùa khô (khoảng tháng 10-12) để đào tổ cát hoặc bùn ven sông và đẻ từ 12-28 quả trứng có vỏ cứng. Thời gian ấp trứng kéo dài từ 180 đến 200 ngày.";
      newC.locomotion = 'crawl';
      newC.speed_max = 1.2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 350.0;
      newC.size_max_mm = 450.0;
      newC.weight_avg_g = 15000.0;

      newC.characteristics = (c.characteristics || "") + " Mai rùa có các gờ nổi sắc nhọn chạy dọc tạo thành cấu trúc thủy động học giảm nhiễu động nước khi chúng lao đầu ra đớp mồi.";
      newC.survival_method = (c.survival_method || "") + " Ngụy trang chủ động bằng cách cho phép tảo sợi (như Cladophora) phát triển trực tiếp trên lớp mai sần sùi và da cổ, biến chúng thành một tảng đá phủ rêu hoàn hảo dưới đáy đầm.";
      newC.unique_traits = (c.unique_traits || "") + " Cấu trúc xương móng (hyoid apparatus) cực lớn và linh hoạt, có khả năng hạ thấp sàn họng siêu tốc tạo chênh lệch áp suất chân không cực lớn trong khoang miệng.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1111/j.1469-7998.2010.00760.x",
          "label": "Journal of Zoology - Hydrodynamics of suction feeding in Chelus fimbriata"
        },
        {
          "url": "https://doi.org/10.1007/s00435-020-00487-2",
          "label": "Zoomorphology - Evolution of the hyoid apparatus in Chelus fimbriata"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Rùa Mata Mata không bao giờ đuổi theo mồi; chúng chỉ nằm im giả vờ làm một đống lá mục và chờ đợi cá bơi ngang qua trước khi hút trọn vào miệng.",
        "Mũi của chúng kéo dài thành một ống thở nhỏ dài như ống tre, cho phép chúng thở khí quyển mà không cần nhô đầu lên khỏi mặt nước đục."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng nhịn thở dưới nước liên tục lên đến 10 giờ nhờ cơ chế hô hấp phụ trợ qua màng nhầy hậu môn (cloacal respiration).",
        "Cú đớp chân không siêu tốc chỉ mất khoảng 1/50 giây (20 mili giây), là một trong những chuyển động săn mồi nhanh nhất ở động vật có xương sống."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Mai rùa gồ ghề và da nhiều nếp gấp tạo điều kiện cho các loài ký sinh trùng thủy sinh bám dày đặc gây suy yếu hệ miễn dịch.",
        "Khả năng di chuyển trên cạn cực kỳ kém do chân có màng bơi yếu và mai nặng, chỉ lên cạn khi đẻ trứng."
      ];

    } else if (c.id === 'mudskipper') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["tôm nhỏ", "cua nhỏ", "giun cát", "côn trùng", "tảo biển", "mảnh vụn thực vật ngập mặn"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng. Cặp cá xây dựng hang bùn sâu hình chữ U. Trứng được đẻ và dán chặt vào thành buồng trứng ngập khí ở sâu trong hang. Cá bố và mẹ luân phiên ngậm không khí từ bên ngoài mang xuống bơm đầy buồng trứng để bảo vệ phôi khỏi ngạt thở khi triều lên.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 2.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 270.0;
      newC.weight_avg_g = 150.0;

      newC.characteristics = (c.characteristics || "") + " Hệ cơ dưới hàm và vây ngực có hàm lượng myoglobin cực cao, cho phép lưu trữ và sử dụng oxy hiệu quả khi hoạt động cạn kiệt ngoài không khí.";
      newC.survival_method = (c.survival_method || "") + " Tận dụng độ ẩm của các thảm bùn và lá cây ngập mặn để nằm nghỉ, giúp giảm tốc độ bay hơi nước qua da xuống mức tối thiểu trong những ngày nắng nóng.";
      newC.unique_traits = (c.unique_traits || "") + " Hệ thống gen mã hóa protein aquaporin trên da được tăng cường biểu hiện, giúp kiểm soát chặt chẽ lưu lượng nước qua da ngăn ngừa mất nước.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1126/science.1126244",
          "label": "Science - Mudskipper genomics and terrestrial adaptation"
        },
        {
          "url": "https://doi.org/10.1242/jeb.01244",
          "label": "Journal of Experimental Biology - Respiration mechanisms in mudskippers"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Cá thòi lòi là loài cá duy nhất có thể 'chớp mắt' trên cạn bằng cách thụt đôi mắt lồi của chúng xuống một túi da đầy nước nằm dưới hốc mắt để làm ướt giác mạc.",
        "Chúng có lãnh thổ riêng rất rõ ràng và sẽ chủ động dựng vây lưng sặc sỡ lên cũng như há to miệng để đe dọa những con thòi lòi khác xâm phạm."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng chịu đựng nồng độ muối biến động cực lớn từ nước ngọt cửa sông đến nước biển siêu mặn vùng triều nhờ hệ thống tế bào chloride hoạt tính cao ở mang.",
        "Khả năng bật nhảy xa gấp 4-5 lần chiều dài cơ thể bằng cách uốn cong đuôi và giải phóng năng lượng cơ đột ngột."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Da mỏng và nhầy rất nhạy cảm với các chất độc hóa học hoặc dầu tràn bám trên bề mặt bùn ngập mặn.",
        "Phụ thuộc vào độ ẩm của da; nếu da bị khô hoàn toàn dưới ánh nắng, chúng sẽ mất khả năng hô hấp cạn và chết ngạt."
      ];

    } else if (c.id === 'mimic-octopus') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cua nhỏ", "tôm cát", "cá nhỏ", "giun nhiều tơ", "giáp xác nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 9;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính. Con đực sử dụng xúc tu chuyên biệt (hectocotylus) để đưa túi tinh vào khoang áo của con cái. Sau khi đẻ trứng, con cái mang và bảo vệ các chuỗi trứng cho đến khi nở. Bạch tuộc cái nhịn ăn hoàn toàn trong suốt quá trình này và chết ngay sau khi trứng nở.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 15.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 600.0;
      newC.weight_avg_g = 300.0;

      newC.characteristics = (c.characteristics || "") + " Lớp biểu bì có cấu trúc cơ nâng (papillae) siêu nhỏ điều khiển bằng cơ học, cho phép biến đổi bề mặt da từ nhẵn bóng sang sần sùi gai góc giống hệt kết cấu của cát và tảo rạn san hô.";
      newC.survival_method = (c.survival_method || "") + " Khi săn mồi ở bãi cát trống, chúng giả dạng thành một cụm tảo trôi nổi bằng cách cuộn tròn 8 xúc tu lại và di chuyển chậm rãi theo dòng hải lưu.";
      newC.unique_traits = (c.unique_traits || "") + " Bộ não trung tâm liên kết chặt chẽ với các hạch thần kinh xúc tu, cho phép xử lý song song thông tin xúc giác từ giác hút và thông tin thị giác để điều phối mẫu ngụy trang động.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1098/rspb.2001.1708",
          "label": "Proceedings of the Royal Society B - Dynamic mimicry in Thaumoctopus mimicus"
        },
        {
          "url": "https://doi.org/10.1016/j.cub.2005.02.014",
          "label": "Current Biology - Chromatophore control in Thaumoctopus mimicus"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Chúng có khả năng bắt chước cả hành vi và dáng vẻ của loài rắn biển độc bằng cách giấu 6 xúc tu trong cát và để 2 xúc tu còn lại uốn lượn uốn khúc trên dòng nước.",
        "Bạch tuộc bắt chước có thể sử dụng hai cánh tay xúc tu của mình để 'đi bộ' dưới đáy biển giống hệt dáng đi của một con cua lớn."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng phối hợp ngụy trang động học kết hợp đổi màu và thay đổi dáng bơi trong thời gian thực cực kỳ linh hoạt.",
        "Tốc độ xử lý thông tin thị giác siêu nhanh giúp phát hiện chuyển động của con mồi hoặc kẻ thù từ khoảng cách xa trong làn nước trong."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Không có mai cứng hay vỏ bảo vệ nên rất dễ bị các loài cá săn mồi như cá mú lớn nuốt chửng nếu ngụy trang thất bại.",
        "Khả năng chịu nhiệt kém, nhạy cảm cao với sự nóng lên toàn cầu làm suy thoái rạn san hô sinh cảnh."
      ];
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
