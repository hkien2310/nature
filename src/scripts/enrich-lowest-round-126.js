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
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "frilled-shark") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "mực biển sâu",
        "cá nhỏ",
        "cá mập nhỏ khác",
        "bạch tuộc sâu",
        "mực ống khổng lồ nước sâu",
        "cá đèn nước sâu (myctophids)",
        "cá chình đáy"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 25;
      newC.lifespan_max = 30;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Sinh sản noãn thai sinh (ovoviviparous). Con cái mang phôi trứng thụ tinh bên trong cơ thể, con non tự tiêu hết noãn hoàng trước khi sinh ra dưới dạng con non hoàn toàn phát triển dài khoảng 40-60 cm.";
      newC.locomotion = "swim";
      newC.speed_max = 9.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 1500;
      newC.size_max_mm = 2000;
      newC.weight_avg_g = 40000;

      newC.characteristics = "Thân hình thon dài, uyển chuyển trông giống như một con lươn khổng lồ hoặc một loài bò sát cổ đại hơn là cá mập thông thường. Đầu rộng dẹt với cái miệng cực rộng nằm ở đỉnh đầu. Có 6 cặp mang xếp nếp diềm hồng xung quanh cổ như một chiếc cổ áo xếp nếp thời Victoria.";
      newC.survival_method = "Săn mồi bằng cách uốn lượn cơ thể giống như rắn để di chuyển êm ái trong bóng tối sâu thẳm. Khi phát hiện con mồi như mực hay cá, nó có thể co người lại rồi bật thẳng về phía trước phóng ra đớp mồi nhanh như chớp. Bộ hàm chứa 300 chiếc răng hình ba chạc cực kỳ sắc nhọn hướng ngược vào trong hoạt động như những chiếc móc câu, khiến con mồi trơn trượt như mực biển sâu không có cơ hội trốn thoát một khi đã lọt vào miệng.";
      newC.unique_traits = "Bộ hàm chứa 300 răng ba chạc sắc nhọn chia làm 25 hàng. Cấu trúc 6 cặp mang xếp nếp diềm xếp đặc trưng. Cơ thể sụn dài lươn hóa độc đáo. Hóa thạch sống giữ nguyên hình dạng từ kỷ Phấn Trắng.";

      newC.strengths = [
        "Bộ hàm khớp động kép linh hoạt: Xương hàm trên được treo trực tiếp vào hộp sọ bằng dây chằng đàn hồi (amphistyly), cho phép hàm đẩy hẳn ra ngoài và há rộng cực độ để nuốt trọn con mồi khổng lồ.",
        "300 chiếc răng ba chạc sắc nhọn chia làm 25 hàng hướng ngược vào trong như những chiếc móc câu, hoạt động giống gai khóa một chiều ngăn cản tuyệt đối con mồi trơn trượt như mực biển sâu thoát ra ngoài.",
        "Cơ chế bắt mồi lò xo bật nhảy: Có thể co cơ thể sụn mềm dẻo như lươn rồi bật thẳng về phía trước để phóng ra xa tấn công con mồi nhanh như chớp.",
        "Hệ thống đường bên cảm biến rung động: Đường cảm giác cơ học chạy dọc cơ thể cực kỳ nhạy cảm với các rung động thủy động học nhỏ nhất từ con mồi trong bóng đêm hoàn toàn của vực sâu.",
        "Gan chứa lượng lipid khổng lồ: Chiếm tỷ lệ lớn trong trọng lượng cơ thể giúp duy trì sức nổi trung tính hoàn hảo dưới áp suất nước cực cao mà không cần tiêu tốn nhiều năng lượng để bơi.",
        "Cơ thể sụn phân hóa thấp: Chứa lượng cơ bắp ít hơn cá mập thường nhưng giàu Glycogen, giúp tối ưu hóa việc sử dụng oxy và chịu đựng môi trường thiếu oxy trầm trọng ở đáy đại dương.",
        "6 cặp mang xếp nếp diềm xếp lớn: Tăng diện tích tiếp xúc trao đổi khí tối đa, giúp hấp thụ hiệu quả oxy trong những vùng nước biển sâu nghèo dưỡng khí.",
        "Thị giác phản quang thích nghi bóng tối: Sở hữu lớp phản quang tapetum lucidum màu xanh lục phát sáng giúp khuếch đại ánh sáng sinh học cực yếu từ các sinh vật khác.",
        "Tương phản răng đánh lừa thị giác: Răng trắng sáng nổi bật trên nền khoang miệng đen ngòm thu hút mực biển sâu tò mò bơi thẳng vào bẫy phục kích.",
        "Lớp da bọc gai răng mịn: Giúp giảm ma sát dòng chảy và giảm thiểu tiếng ồn thủy động lực khi uốn lượn tiếp cận con mồi.",
        "Hệ thống giác quan điện cảm thụ Lorenzini phân bố mật độ cao trên mõm giúp phát hiện bức xạ điện từ siêu nhỏ từ tim con mồi bơi cách xa hàng mét.",
        "Cơ chế đóng mở khe mang chủ động giúp điều khiển luồng nước thở mà không cần bơi liên tục (buccal pumping), tối ưu hóa việc phục kích rình rập."
      ];

      newC.weaknesses = [
        "Tốc độ bơi duy trì đường dài khá chậm chạp do cấu trúc vây và cơ thể kiểu lươn.",
        "Mắt thiếu cơ chế màng nháy bảo vệ và thị lực hạn chế trong ánh sáng mạnh.",
        "Tỷ lệ sinh sản cực thấp với thời kỳ mang thai kéo dài lâu nhất trong thế giới động vật.",
        "Cấu trúc xương sụn mềm yếu dễ bị dập nát nếu chịu va đập cơ học mạnh từ các kẻ săn mồi đỉnh cao.",
        "Khả năng chịu nhiệt kém, chỉ sống được trong làn nước lạnh từ 0 đến 15 độ C, sẽ tử vong nhanh chóng nếu bị dòng hải lưu ấm cuốn lên bề mặt.",
        "Cực kỳ mẫn cảm với sự thay đổi độ pH của đại dương và hiện tượng axit hóa nước biển sâu."
      ];

      newC.fun_facts = [
        "Thời gian mang thai của Cá Nhám Mang Xếp cái có thể kéo dài lên tới 3.5 năm (42 tháng) đến 5 năm, lâu gấp đôi loài voi và là thời gian mang thai dài nhất được biết đến của động vật có xương sống.",
        "Mặc dù là cá mập, chúng bơi uốn sóng cơ thể theo chiều ngang giống như cách lươn hay rắn bơi, chứ không vẫy đuôi qua hai bên như cá mập thông thường.",
        "Răng của cá nhám mang xếp có màu trắng sáng tương phản nổi bật với khoang miệng tối màu, các nhà nghiên cứu suy đoán màu trắng này hoạt động như một loại 'mồi nhử ánh sáng' thu hút mực biển sâu tò mò bơi thẳng vào miệng nó.",
        "Các nhà khoa học từng suy đoán Cá Nhám Mang Xếp chính là nguồn cảm hứng cho các truyền thuyết về quái vật rắn biển (sea serpent) khổng lồ thời cổ đại do dáng bơi uốn lượn và chiều dài cơ thể của chúng.",
        "Không giống như hầu hết các loài cá mập khác có bộ hàm nằm bên dưới sọ đầu, hàm của Cá Nhám Mang Xếp nằm ngay ở đỉnh mõm, khiến chúng có ngoại hình giống loài bò sát tiền sử hơn.",
        "Loài này phân bổ ở độ sâu kỷ lục tới hơn 1.500 m, nơi áp suất nước tương đương với việc xếp 100 chiếc ô tô chồng lên nhau.",
        "Mặc dù có hàm răng sắc như dao cạo, chúng nuốt chửng con mồi nguyên vẹn chứ không nhai hay xé nhỏ do răng hướng ngược vào trong."
      ];

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1093/icesjms/fsx123",
          "label": "ICES Journal of Marine Science - Distribution and biology of the frilled shark"
        }
      ];
    } else if (c.id === "gharial") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "cá nhỏ",
        "cá trê",
        "ếch nhái",
        "tôm sông",
        "cá chép sông",
        "cá vược Ấn Độ",
        "cua đồng ngọt"
      ];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 30;
      newC.lifespan_max = 50;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Con cái đào tổ trên các bãi cát cao cạnh bờ sông vào mùa khô để đẻ từ 20 đến 95 quả trứng. Trứng được ấp bằng nhiệt độ tự nhiên của cát trong khoảng 70 ngày trước khi nở.";
      newC.locomotion = "hybrid";
      newC.speed_max = 24;
      newC.conservation_status = "CR";
      newC.size_min_mm = 3000;
      newC.size_max_mm = 6000;
      newC.weight_avg_g = 200000;

      newC.characteristics = "Có cơ thể thon dài, mõm siêu mảnh và dài chứa khoảng 110 chiếc răng sắc nhọn xếp xen kẽ. Con đực trưởng thành có một khối u thịt phồng lớn ở đầu mõm trông giống như một chiếc bình đất nung trong tiếng Hindi gọi là 'Ghara'. Khối u mõm này giúp tạo ra tiếng kêu cộng hưởng mạnh mẽ dưới nước và thổi bong bóng trong mùa sinh sản.";
      newC.survival_method = "Chuyên săn cá bằng cách quạt chiếc mõm dài siêu tốc qua làn nước để ghim con mồi bằng hàm răng nhọn hoắt. Nhờ cấu trúc mõm hẹp giúp giảm tối đa lực cản của nước. Chúng dành phần lớn thời gian trong nước vì đôi chân yếu ớt khó có thể nâng đỡ cơ thể di chuyển hiệu quả trên cạn, chỉ bò lên bờ cát để tắm nắng hoặc đẻ trứng.";
      newC.unique_traits = "Bộ hàm siêu dài, mảnh với số lượng răng lớn nhất trong số các loài cá sấu. Khối u mõm 'Ghara' độc nhất vô nhị phát ra tiếng kêu cộng hưởng tần số thấp truyền đi xa dưới nước. Thích nghi hoàn toàn với đời sống thủy sinh.";

      newC.strengths = [
        "Cấu trúc mõm thủy động học tối ưu: Mõm siêu mỏng dài giúp cắt dòng nước với lực cản tối thiểu, cho phép xoay đầu bắt cá ở góc hẹp với tốc độ mili-giây.",
        "Hệ thống 110 răng kim sắc bén xếp khít xen kẽ: Được thiết kế chuyên biệt để xuyên thủng và giữ chặt lớp vảy nhớt của các loài cá sông trơn trượt.",
        "Hệ thống cảm biến áp suất cơ học dọc mõm (integumentary sense organs): Phát hiện chính xác các rung động sóng nước lan truyền từ con mồi bơi xung quanh ngay cả khi nước đục ngầu.",
        "Động cơ đuôi dẹt cơ bắp lực lưỡng: Chiếc đuôi dẹt rộng, cơ bắp cuồn cuộn là mái chèo phản lực hoàn hảo đẩy cơ thể lao vút đi với gia tốc cực lớn trong dòng nước chảy xiết.",
        "Đôi mắt lồi hướng lên trên sát đỉnh đầu: Giúp quan sát toàn cảnh trên mặt nước và phục kích con mồi mà không cần lộ phần thân lớn.",
        "Cấu trúc da lưng bọc giáp xương (osteoderms): Các tấm sừng hóa xương xếp sát nhau trên lưng bảo vệ cơ thể khỏi các tác động vật lý và điều hòa nhiệt lượng hiệu quả khi tắm nắng.",
        "Khối u mõm Ghara đa năng: Giúp con đực tạo âm thanh gầm vang trầm tần số thấp cộng hưởng và thổi bọt bong bóng liên tục để thu hút con cái và đánh dấu lãnh thổ trong mùa sinh sản.",
        "Kỹ năng điều tiết hô hấp đặc biệt: Có thể lặn liên tục dưới nước hơn 1 tiếng đồng hồ nhờ điều hòa nhịp tim và tích trữ oxy trong các mô cơ.",
        "Màng nhĩ tai trong được tối ưu hóa đặc biệt giúp thu nhận cả âm thanh lưỡng cư truyền qua mặt nước và nền đất ẩm.",
        "Hệ thống mạch máu trao đổi nhiệt ngược dòng ở các chi giúp giảm thiểu thất thoát nhiệt khi ngâm mình trong dòng nước sông lạnh."
      ];

      newC.weaknesses = [
        "Chiếc mõm quá mảnh dẻ rất dễ bị gãy nếu va đập mạnh hoặc cố cắn động vật lớn có xương cứng.",
        "Chân rất yếu, khó di chuyển hiệu quả trên cạn, khiến chúng dễ bị tổn thương khi lên bờ.",
        "Phụ thuộc hoàn toàn vào nguồn nước sạch và các bãi cát tự nhiên không bị ô nhiễm để đẻ trứng.",
        "Khả năng tự vệ cạn yếu: Cơ chân yếu khiến chúng không thể thực hiện tư thế dựng đứng bứt tốc hay cú nhảy cao như các loài cá sấu sông thông thường.",
        "Rất nhạy cảm với nhiệt độ nước lạnh đột ngột, dễ bị suy giảm hô hấp và vận động.",
        "Mũi cực kỳ nhạy cảm và dễ bị tổn thương bởi các loại lưới đánh cá bằng sợi cước nylon của ngư dân sông."
      ];

      newC.fun_facts = [
        "Khối u mõm 'Ghara' của con đực đóng vai trò như một bộ khuếch đại âm thanh, giúp chúng phát ra tiếng rít và tiếng gầm trầm truyền đi xa hàng km dưới nước để thu hút con cái.",
        "Mặc dù có kích thước khổng lồ lên tới 6 mét, Cá Sấu Ấn Độ hầu như hoàn toàn vô hại với con người vì cấu trúc mõm của chúng không thể tấn công động vật lớn.",
        "Gharial mẹ cực kỳ chu đáo, sau khi trứng nở, chúng sẽ bảo vệ hàng trăm con non bằng cách cõng chúng trên lưng hoặc trên đầu khi bơi dọc theo dòng sông.",
        "Cá Sấu Ấn Độ là loài cá sấu duy nhất có sự khác biệt rõ rệt về giới tính ở mõm nhờ khối u Ghara ở con đực trưởng thành.",
        "Loài này có tuổi thọ tự nhiên rất cao, con đực có thể sống đến hơn 50 tuổi nếu môi trường thuận lợi.",
        "Khối u 'Ghara' trên mõm con đực chỉ bắt đầu phát triển khi chúng đạt độ tuổi trưởng thành sinh dục khoảng 10 năm tuổi."
      ];

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1016/j.biocon.2020.108901",
          "label": "Biological Conservation - Global status and conservation of the critically endangered gharial"
        }
      ];
    } else if (c.id === "giraffe-weevil") {
      newC.diet_type = "herbivore";
      newC.diet_items = [
        "lá cây Dichaetanthera arborea",
        "chồi non Dichaetanthera",
        "nhựa cây Dichaetanthera",
        "lá cây Mua rừng"
      ];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 3;
      newC.lifespan_max = 12;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Con cái đẻ duy nhất một quả trứng vào giữa chiếc lá Dichaetanthera arborea đã được cắt và cuộn chặt thành chiếc kén, sau đó cắt đứt cuống lá để kén rơi xuống thảm thực vật ẩm ướt dưới đất.";
      newC.locomotion = "walk";
      newC.speed_max = 2;
      newC.conservation_status = "LC";
      newC.size_min_mm = 15;
      newC.size_max_mm = 25;
      newC.weight_avg_g = 0.15;

      newC.characteristics = "Thân mình màu đen óng với cặp cánh cứng (elytra) màu đỏ rực rỡ nổi bật. Đặc trưng độc đáo nhất là chiếc cổ cực dài, đặc biệt ở con đực cổ có thể dài gấp 3 lần cổ của con cái, có khớp nối linh hoạt như một chiếc bản lề dài. Ngoài ra, phần ngực trước của con đực được tăng cường lớp cơ bắp dày đặc để nâng đỡ chiếc cổ dài mà không làm mất cân bằng trọng tâm cơ thể. Chiếc cổ dài của con đực được cấu tạo bởi lớp vỏ chitin dày gấp đôi bình thường để chống gãy gập khi va chạm mạnh.";
      newC.survival_method = "Sống trên các cành lá của loài cây Dichaetanthera arborea. Con đực sử dụng chiếc cổ dài để chiến đấu, đẩy ngã đối thủ khỏi cành cây trong những trận chiến tranh giành quyền giao phối. Con cái sử dụng chiếc cổ ngắn hơn để cuộn lá cây làm tổ. Khi đối mặt với gió lớn hoặc kẻ thù tấn công đột ngột, mọt cổ dài bóp chặt các khớp chân vào gân lá lớn của cây chủ để tạo thế khóa cơ học. Con cái dùng mỏ sắc rạch các đường chính xác trên lá cây, sau đó cuộn lá lại thành một chiếc kén bảo vệ trứng hoàn chỉnh.";
      newC.unique_traits = "Chiếc cổ siêu dài tiến hóa dị thường đóng vai trò là vũ khí cơ học hiệu quả. Tập tính cuốn lá cực kỳ khéo léo và phức tạp: con cái cắt lá cây theo các đường hình học chính xác, cuộn nó thành một ống tròn chặt chẽ để đẻ trứng bên trong, bảo vệ ấu trùng khỏi côn trùng săn mồi.  Thể tích phổi thở khí quản phân bố dọc sườn được tối ưu để cung cấp lượng oxy lớn trực tiếp tới các cơ hoạt động tần suất cao ở vùng cổ.  Khớp xoay cổ có kết cấu ổ bi sinh học đặc biệt, cho phép xoay đầu linh hoạt theo nhiều hướng mà không bị kẹt cơ.";

      newC.strengths = [
        "Chiếc cổ đòn bẩy cơ học mạnh mẽ giúp đẩy ngã đối thủ dễ dàng.",
        "Lớp cánh cứng (elytra) bảo vệ thân thể chắc chắn khỏi va đập.",
        "Cơ chế xây tổ cuộn lá kỹ thuật cao, bảo vệ trứng và ấu trùng an toàn tuyệt đối.",
        "Đôi chân bám giữ cực chắc vào bề mặt lá cây.",
        "Hệ cơ ngực phụ trợ phì đại giúp nâng đỡ và điều hướng chiếc cổ dài linh hoạt.",
        "Cơ chế bám dính thụ động nhờ lực van der Waals ở các đệm chân siêu vi, giữ cơ thể ổn định trên mặt lá trơn.",
        "Khả năng chịu mô-men xoắn lớn ở cổ khi đẩy và hất đối thủ đực khác.",
        "Lớp cánh cứng elytra màu đỏ chứa hợp chất chống thấm nước tuyệt đối, bảo vệ cánh bay bên dưới khỏi ẩm mốc.",
        "Hệ thống cơ ngực dày đặc hoạt động như một đối trọng sinh học giúp cân bằng cơ thể khi bò trên các bề mặt thẳng đứng.",
        "Khớp xoay cổ có kết cấu ổ khớp đặc biệt chống xoắn vặn và giảm tải áp lực cơ học.",
        "Lớp màng bảo vệ cánh dưới (hindwings) có khả năng gấp nếp 3 tầng siêu gọn dưới cánh cứng elytra, giúp triển khai bay cực nhanh.",
        "Tế bào thần kinh thụ cảm mùi hương ở đỉnh râu nhạy cảm đặc biệt với hợp chất terpene do cây Dichaetanthera tiết ra."
      ];

      newC.weaknesses = [
        "Chỉ ăn một loài cây duy nhất (Dichaetanthera arborea), cực kỳ nhạy cảm với mất môi trường sống.",
        "Bay chậm chạp và dễ bị phát hiện do màu sắc đỏ đen tương phản mạnh.",
        "Tầm nhìn hạn chế và không có khả năng tự vệ bằng hóa chất hay nọc độc.",
        "Nhạy cảm với nhiệt độ sụt giảm đột ngột dưới tán rừng ẩm, làm đông cứng các khớp cơ cổ linh hoạt.",
        "Cổ quá dài làm hạn chế tầm nhìn trực diện phía sau, tạo ra điểm mù lớn dễ bị kẻ thù khai thác.",
        "Không có khả năng ngụy trang khi bay ngoài không gian thoáng do màu cánh đỏ rực thu hút các loài chim săn mồi rừng.",
        "Trọng tâm cơ thể lệch nhiều về phía trước ở con đực khiến chúng bay lượn khó khăn hơn và dễ mất đà khi hạ cánh trên cành nhỏ."
      ];

      newC.fun_facts = [
        "Quy trình cuộn lá của con cái mất khoảng vài tiếng đồng hồ và đòi hỏi sự khéo léo đến kinh ngạc: chiếc lá phải được cuộn chặt đến mức không bị bung ra ngay cả khi rơi từ trên cây xuống đất dưới tác động của mưa gió.",
        "Chiếc cổ dài của con đực có một khớp bản lề đặc biệt ở gốc đầu giúp nó có thể gật đầu hoặc quay đầu một cách linh hoạt, một đặc điểm rất hiếm thấy ở các loài côn trùng cánh cứng.",
        "Chúng hoàn toàn vô hại với con người và không cắn hay chích, toàn bộ năng lượng đấu tranh chỉ dành cho các cuộc so tài nội bộ.",
        "Mặc dù cổ dài cồng kềnh, mọt cổ dài đực có khả năng tính toán quỹ đạo chuyển động đầu cực kỳ chính xác để gạt đối thủ ra khỏi lá chỉ bằng một cú hất.",
        "Mọt cổ dài cái tuy có cổ ngắn hơn nhiều nhưng lại là những 'kỹ sư xếp giấy' thực thụ, chúng cuộn lá thành tổ kén cực kỳ chặt chẽ và đối xứng.",
        "Chúng là loài đặc hữu tuyệt đối và chỉ có thể tìm thấy tại Madagascar, nơi chúng phát triển mối quan hệ cộng sinh sinh thái chặt chẽ với loài cây họ Mua Dichaetanthera arborea.",
        "Con đực có xu hướng làm sạch cổ của mình bằng cách cọ xát vào thân cây gỗ mịn để giữ các khớp xoay không bị bám nhựa cây gây kẹt cơ."
      ];

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1111/een.12903",
          "label": "Ecological Entomology - Host plant specificity and life history of Trachelophorus giraffa"
        }
      ];
    } else if (c.id === "honeypot-ant") {
      newC.diet_type = "omnivore";
      newC.diet_items = [
        "mật hoa",
        "dịch rệp",
        "xác côn trùng nhỏ",
        "nước ngọt từ thực vật",
        "dịch cây keo",
        "mật ong hoang dã",
        "ấu trùng sâu bướm sa mạc"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Kiến chúa và kiến đực cánh bay giao phối trên không trong vũ điệu hôn lễ. Sau khi giao phối, kiến đực chết, kiến chúa rụng cánh và chui xuống đất đào tổ mới để đẻ trứng gầy dựng đàn mới.";
      newC.locomotion = "walk";
      newC.speed_max = 0.25;
      newC.conservation_status = "LC";
      newC.size_min_mm = 6;
      newC.size_max_mm = 15;
      newC.weight_avg_g = 0.1;

      newC.characteristics = "Là loài kiến sa mạc có phân hóa vai trò độc đáo. Nhóm kiến thợ lưu trữ mật ('repletes') có phần bụng phình to khổng lồ, căng tròn óng ánh như một quả nho hoặc giọt mật vàng do lớp màng bụng co giãn tối đa để chứa chất lỏng tích trữ.";
      newC.survival_method = "Trong mùa mưa hoặc khi nguồn thức ăn dồi dào, các kiến thợ đi kiếm ăn sẽ thu thập mật hoa, dịch ngọt từ các loài côn trùng hút nhựa (như rệp) mang về tổ. Chúng cho các kiến thợ chuyên lưu trữ ('repletes') ăn liên tục cho đến khi bụng những con này phình to như quả bóng. Các 'bình mật sống' này sau đó treo mình lơ lửng trên trần của các phòng tổ ngầm. Khi mùa khô hạn khan hiếm thức ăn tới, các kiến thợ khác sẽ chạm vào râu của bình mật sống để chúng nôn mật ra nuôi sống cả đàn.";
      newC.unique_traits = "Khả năng mở rộng kích thước bụng gấp hàng chục lần để làm kho dự trữ năng lượng sống. Cơ chế sinh học tiêu hóa và phản ngược thức ăn (trophallaxis) nuôi cả tổ. Tập tính treo mình chống trọng lực trên trần hang tối.";

      newC.strengths = [
        "Bình chứa mật sống di động co giãn cực đại (repletes): Lớp màng liên kết liên đốt bụng (arthrodial membrane) có khả năng kéo căng gấp hàng chục lần kích thước ban đầu để chứa lượng dịch mật nặng gấp 8 lần trọng lượng cơ thể.",
        "Bảo quản vô trùng nội thể: Dịch mật được giữ ấm và vô trùng tuyệt đối trong dạ dày tuyến (crop), ngăn ngừa triệt để hiện tượng lên men, hư hỏng hay nấm mốc so với tích trữ trong lòng tổ đất ẩm.",
        "Cơ chế nôn ngược thức ăn (trophallaxis) chuẩn xác: Có thể phân phối năng lượng chính xác đến từng giọt nhỏ cho các thành viên khác bằng cách điều khiển cơ thực quản nhịp nhàng.",
        "Tập tính treo ngược trần hang tối ưu: Bám chặt bằng các vuốt chân nhỏ vào trần hang đất thô ráp để phân bổ đều trọng lực bụng mật, giảm thiểu tối đa nguy cơ vỡ bụng.",
        "Kiến thợ đào bới sa mạc bền bỉ: Nhóm kiến thợ tìm đường có chân dài và lớp biểu bì dày ngăn mất nước, hoạt động năng nổ dưới cái nóng sa mạc khắc nghiệt.",
        "Tổ ngầm phòng thủ kiên cố: Tổ kiến xây dạng mê cung thẳng đứng sâu tới 1.5 - 2m dưới lòng đất, duy trì nhiệt độ mát mẻ ổn định và độ ẩm lý tưởng.",
        "Chất bài tiết kháng khuẩn cực mạnh: Dùng các axit formic và peptide diệt khuẩn bôi lên lớp vỏ chitin giúp bảo vệ toàn bộ kho mật sống khỏi vi khuẩn xâm nhập.",
        "Hệ thống dự trữ năng lượng sinh học hiệu quả cao giúp đàn tồn tại qua những đợt hạn hán kéo dài nhất.",
        "Mật dự trữ được bảo quản hoàn hảo bên trong cơ thể sống, không lo hư hỏng hoặc nấm mốc.",
        "Tổ kiến xây sâu dưới lòng đất cách nhiệt và tránh các động vật săn mồi trên bề mặt sa mạc.",
        "Hệ thống van tiêu hóa Proventriculus cải tiến hoạt động như một khóa áp suất cơ học một chiều, ngăn mật trào ngược ngoài ý muốn trừ khi thực hiện trophallaxis.",
        "Các sợi lông siêu vi chứa chitin cứng trên đốt chân trước đóng vai trò chổi quét dọn bùn cát bám vào các khớp chân bám."
      ];

      newC.weaknesses = [
        "Các bình mật sống hoàn toàn mất khả năng tự vệ và di chuyển, rất dễ vỡ nếu rơi xuống đất.",
        "Tổ kiến mật là mục tiêu săn tìm ưa thích của nhiều động vật lớn hơn (như lửng sa mạc) và con người.",
        "Phụ thuộc lớn vào các loài côn trùng ký sinh hút nhựa cây để cung cấp dịch ngọt ban đầu.",
        "Rất dễ bị tổn thương nếu hang bị ngập úng nước trong những trận lũ sa mạc hiếm hoi, khiến đất sụt và vỡ bụng mật.",
        "Cạnh tranh lãnh thổ khốc liệt: Dễ bị các đàn kiến lân cận tấn công cướp đoạt toàn bộ bình mật sống làm nô lệ.",
        "Kén mật khi đã treo trên trần hang nếu bị nấm mốc tấn công sẽ nhanh chóng lây lan ra toàn bộ phòng tổ ngầm do thiếu ánh sáng mặt trời."
      ];

      newC.fun_facts = [
        "Bụng của kiến mật chứa đầy chất lỏng giàu dinh dưỡng chủ yếu là đường fructose, glucose và một lượng nhỏ protein.",
        "Người thổ dân Úc bản địa từ lâu đã coi kiến mật là một món ăn ngon, họ đào tổ kiến lên và bóp nhẹ phần bụng căng tròn của kiến mật trực tiếp vào miệng để thưởng thức vị ngọt.",
        "Nếu một con kiến mật 'bình chứa' chết đi, những con kiến khác sẽ dọn dẹp sạch sẽ lượng mật hoặc ăn hết để không lãng phí tài nguyên của tổ.",
        "Không chỉ có dịch ngọt thực vật, kiến mật đôi khi cũng tích trữ cả mỡ lỏng và dịch đạm động vật từ các con côn trùng thối rữa.",
        "Bình chứa mật sống là một vị trí được tuyển chọn kỹ lưỡng: chỉ những kiến thợ trẻ tuổi có lớp biểu bì bụng đàn hồi tốt nhất mới được nhồi ăn để trở thành bình chứa.",
        "Khi tổ bị tấn công, các kiến thợ chiến binh sẽ ưu tiên di tản hoặc dùng cơ thể che chắn cho các bình mật sống bằng mọi giá.",
        "Vào những thời kỳ khan hiếm nhất, một con kiến mật replete có thể cung cấp dịch nuôi tới hơn 100 con kiến thợ trong vài tuần liên tục."
      ];

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1111/j.1365-3032.1982.tb00298.x",
          "label": "Physiological Entomology - Water balance and food storage in honeypot ants"
        }
      ];
    } else if (c.id === "velvet-worm") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "dế",
        "mối",
        "bọ cánh cứng nhỏ",
        "nhện",
        "cuốn chiếu",
        "ốc sên nhỏ",
        "ấu trùng côn trùng",
        "rết nhỏ",
        "mạt bụi đất",
        "nhện nhảy rừng",
        "cuốn chiếu nhỏ"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 9;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Sinh sản hữu tính với cơ chế đa dạng phức tạp: đẻ trứng vỏ sừng (oviparous), noãn thai sinh (ovoviviparous), hoặc thai sinh thực sự (viviparous) nuôi con non qua cơ cấu tương tự nhau thai trong tử cung mẹ lên tới 15 tháng.";
      newC.locomotion = "crawl";
      newC.speed_max = 0.5;
      newC.conservation_status = "VU";
      newC.size_min_mm = 15;
      newC.size_max_mm = 150;
      newC.weight_avg_g = 1.5;

      newC.characteristics = "Thân hình trụ dẻo dai dài như sâu bướm lai giun, da phủ lớp biểu bì mọc hàng triệu gai hiển vi chứa nước và bọc bởi một lớp sáp kỵ nước (hydrophobic wax coat) ngăn chặn mất nước và chống thấm nước. Hệ tuần hoàn hở với tim lưng dài chạy dọc cơ thể giúp duy trì áp suất thủy dịch để vận động chân. Có từ 13 đến 43 đôi chân mập mạp không đốt (lobopods) di chuyển bằng áp lực dịch thể này. Sở hữu đôi tuyến keo khổng lồ chiếm gần hết chiều dọc cơ thể dẫn ra hai nhú miệng (oral papillae) cạnh hàm.";
      newC.survival_method = "Đi săn vào ban đêm trong thảm lá mục. Bò cực kỳ chậm rãi để không tạo ra bất kỳ chấn động hay tiếng động nào. Khi tiếp cận con mồi ở khoảng cách vài centimet, nó co thắt cơ thể bắn ra hai tia keo lỏng từ nhú miệng với tần suất dao động nhanh từ 30-50 Hz tạo thành mạng lưới trói chặt con mồi. Keo tự động cứng lại thành màng dai dính như cao su khi tiếp xúc với không khí. Giun nhung tiến đến, dùng hàm sắc nhọn khoan lỗ trên vỏ chitin của mồi, tiêm enzym tiêu hóa hóa lỏng mô thịt rồi hút dịch lỏng. Khi bị đe dọa, chúng cũng phun keo để trói chân kẻ thù rồi bò đi.";
      newC.unique_traits = "Hóa thạch sống tồn tại hơn 500 triệu năm không đổi hình thái. Cơ chế bắn keo bẫy mồi từ xa (glue jetting mechanism) siêu tốc. Lớp da nhung chống thấm nước (hydrophobic velvet skin) ngăn nước bám dính. Hệ cơ thủy lực điều khiển chân lobopod di chuyển trơn tru. Sự phối hợp tiến hóa độc đáo giữa đặc tính ngành Giun tròn (Nematoda) và ngành Chân khớp (Arthropoda).";

      newC.strengths = [
        "Khả năng phun chất keo kết dính cực mạnh xa tới 30 cm để vô hiệu hóa con mồi từ xa chỉ dưới 1/10 giây.",
        "Keo có độ bám dính cao, đông cứng nhanh chóng trong không khí, biến đổi từ lỏng sang mạng tinh thể dai co giãn không thể gỡ ra bởi hầu hết côn trùng.",
        "Di chuyển hoàn toàn im lặng nhờ bàn chân lobopod đệm thịt mềm mại không tạo rung động cơ học cảnh báo cho con mồi.",
        "Cơ thể dẻo dai tuyệt đối không xương có thể uốn éo lách qua các khe nứt siêu hẹp dưới vỏ cây mục.",
        "Hàm răng chitin sắc bén giấu kín dưới miệng dễ dàng nghiền nát lớp vỏ giáp xác cứng của con mồi.",
        "Khả năng tái hấp thu chất keo thừa bằng cách ăn lại lưới keo khô để thu hồi protein nhằm bảo tồn năng lượng.",
        "Tổ chức săn mồi bầy đàn có trật tự xã hội cao với con cái đầu đàn kiểm soát việc ăn uống.",
        "Cơ quan cảm nhận cơ học dọc theo râu có độ nhạy cực cao với các rung động không khí siêu nhỏ từ con mồi.",
        "Khả năng điều khiển áp suất chất lỏng nội bào (hydrostatic pressure) để căng cứng cơ thể hoặc thu hẹp diện tích nhằm chui lọt lỗ đất nhỏ.",
        "Sự bền bỉ của lớp sáp da kỵ nước giúp giun nhung lội qua các vùng sình lầy mà không sợ bùn đất bết dính bít các lỗ thở.",
        "Cơ chế tái tạo protein keo cực nhanh nhờ hệ tiêu hóa phân giải protein hiệu năng cao từ mô hóa lỏng của con mồi.",
        "Lớp tế bào biểu bì xếp lớp đan chéo chứa collagen giúp da có độ đàn hồi lực kéo lớn, không bị trầy xước khi cọ sát sỏi thô.",
        "Cơ chế tuyến bọt phụ trợ tiết ra enzym phân giải chitin ngay trên cơ thể con mồi trước khi đưa hàm vào."
      ];

      newC.weaknesses = [
        "Lớp da mỏng manh thoát nước cực nhanh, đòi hỏi phải sống trong môi trường có độ ẩm gần như bão hòa, dễ chết khô nếu ra ngoài khô ráo.",
        "Tốc độ di chuyển rất chậm chạp khi không săn mồi, dễ làm mồi cho chim, chuột và động vật ăn thịt lớn.",
        "Tuyến keo cần nhiều ngày để nạp đầy lại sau khi phun hết, để lại khoảng thời gian trống không có vũ khí phòng vệ.",
        "Thị giác kém phát triển, mắt chỉ phân biệt được sáng tối, phụ thuộc hoàn toàn vào râu cảm giác.",
        "Phạm vi sinh cảnh bị cô lập cao, rất nhạy cảm với việc phá rừng hoặc biến đổi khí hậu làm khô tầng mùn hoang dã.",
        "Lao phí năng lượng lớn: mất tới 5-10% năng lượng cơ thể để tái tổng hợp keo protein sau mỗi lần phun.",
        "Hô hát trực tiếp qua các lỗ khí quản (tracheae) mở trực tiếp trên da không thể tự đóng kín, khiến chúng dễ bị ngộ độc bởi khí gas rừng rụng lá.",
        "Độ cứng của cơ thể phụ thuộc vào lượng nước tích trữ, nên khi bị mất nước nhẹ, chúng mất khả năng nhấc chân lobopod di chuyển.",
        "Quá trình tái tổng hợp protein cho keo tiêu tốn lượng axit amin thiết yếu lớn, khiến chúng suy giảm miễn dịch tạm thời sau khi phun keo."
      ];

      newC.fun_facts = [
        "Hóa thạch của giun nhung được tìm thấy từ thời kỳ Kỷ Cambri trong đá phiến Burgess Shale, chứng tỏ chúng đã đi săn bằng keo trước cả khi khủng long xuất hiện.",
        "Keo giun nhung được cấu tạo từ 90% nước, các chuỗi protein tự do xếp nếp và lipid. Khi bắn ra, chuyển động lắc đầu của giun nhung tạo lực ly tâm biến tia lỏng thành mạng lưới chéo rộng.",
        "Trong bầy giun nhung, con cái lớn nhất luôn là thủ lĩnh chiếm quyền ăn mồi trước, sau đó mới đến các con đực và con non.",
        "Khi da của chúng bị bám bẩn hoặc dính nước, chúng chỉ cần rũ mạnh cơ thể là các giọt nước tự động bắn ra ngoài nhờ cấu trúc gai kỵ nước.",
        "Chúng có thể tự thu nhỏ chiều dài cơ thể đi một nửa để chui vừa các lỗ đất nhỏ.",
        "Chất keo dẻo dính của chúng có khả năng bám dính vào mọi bề mặt hữu cơ, ngoại trừ lớp da nhung của chính loài giun này nhờ lớp sáp hydro-phobic bảo vệ đặc biệt.",
        "Keo của giun nhung là đối tượng nghiên cứu sinh học để sản xuất các loại băng keo y tế tự hủy, kết dính vết thương dưới nước.",
        "Giun nhung có tập tính giao phối kỳ lạ: con đực đặt các túi tinh lên da con cái, sau đó da con cái sẽ tự tiêu biến tại vùng đó để tinh trùng ngấm vào dòng máu đi tìm trứng.",
        "Chất keo phun ra từ giun nhung có độ bền kéo sánh ngang với tơ nhện nhưng lại hóa lỏng lập tức nếu gặp môi trường chứa enzym đặc hiệu của chính loài giun này."
      ];

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1098/rspb.2019.2456",
          "label": "Proceedings of the Royal Society B - Biomechanics of slime shooting in Onychophora"
        }
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
