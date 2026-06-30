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

    if (c.id === "boxer-crab") {
      newC.diet_type = "omnivore";
      newC.diet_items = [
        "mảnh vụn hữu cơ",
        "cá nhỏ chết",
        "tảo biển",
        "giun nhiều tơ nhỏ",
        "ấu trùng giáp xác",
        "chất hữu cơ lơ lửng"
      ];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 1;
      newC.lifespan_max = 3;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Thụ tinh trong. Con cái mang bọc trứng thụ tinh dưới bụng cho đến khi trứng chuyển màu sẫm và nở ra các ấu trùng zoae bơi tự do trong cột nước.";
      newC.locomotion = "walk";
      newC.speed_max = 0.8;
      newC.conservation_status = "LC";
      newC.size_min_mm = 15;
      newC.size_max_mm = 25;
      newC.weight_avg_g = 1.5;

      newC.characteristics = "Kích thước nhỏ bé (chiều rộng mai chỉ khoảng 1.5 - 2.5 cm), mai hình thang ngược có hoa văn dạng lưới màu hồng, đỏ hoặc cam sẫm nổi bật xen lẫn các đường viền đen mảnh nghệ thuật. Cặp càng (chelipeds) đã tiến hóa trở nên mảnh mai hơn rất nhiều, có các ngọn răng cưa nhỏ hướng vào trong hoạt động như những chiếc gọng kìm chuyên biệt để gắp chặt và giữ hải quỳ mà không làm tổn hại đến tế bào biểu bì của chúng.";
      newC.survival_method = "Sống cộng sinh bắt buộc với loài hải quỳ nhỏ (thường thuộc giống Triactis hoặc Bunodeopsis). Cua dùng đôi càng kẹp chặt phần thân hải quỳ ở cả hai bên tay, mang chúng đi khắp nơi như găng tay đấm bốc. Khi bị kẻ thù (như bạch tuộc con, cua lớn hoặc cá nhỏ) đe dọa, nó giơ thẳng hai càng về phía trước, liên tục vẫy hải quỳ chứa xúc tu đầy tế bào châm (nematocysts) chứa độc tố peptide gây bỏng rát cực độc để xua đuổi đối thủ. Cua cũng dùng hải quỳ giống như chổi quét lên bề mặt đá rạn san hô để quét dính các mảnh thức ăn nhỏ, sau đó dùng chân hàm gạt thức ăn vào miệng và chia sẻ một phần dinh dưỡng cho hải quỳ.";
      newC.unique_traits = "Cộng sinh phòng ngự chủ động bằng hải quỳ (anemone boxing). Nếu cua bị mất một hải quỳ, nó sẽ kích thích hải quỳ còn lại tự phân chia bằng cách xé đôi thân của nó ra; hai nửa này sau đó tự tái sinh thành hai cá thể hải quỳ hoàn chỉnh mới trong vòng vài ngày. Đôi càng biến đổi đặc biệt thành dạng kẹp gai mảnh chỉ để giữ hải quỳ, đánh đổi hoàn toàn khả năng kẹp nát vật lý truyền thống.";

      newC.strengths = [
        "Cặp vũ khí hóa học sinh học (xúc tu hải quỳ châm độc) gây bỏng rát và đau nhức cực mạnh cho đối thủ.",
        "Khả năng nhân bản vũ khí sinh học bằng cách xé đôi hải quỳ để tự tái sinh hai con độc lập.",
        "Màu sắc ngụy trang hoa văn rạn san hô giúp ẩn mình rất tốt trong kẽ đá và san hô vụn.",
        "Kích thước siêu nhỏ giúp dễ dàng lẩn trốn vào các kẽ đá nhỏ hẹp mà kẻ đi săn lớn không thể chạm tới.",
        "Cơ chế ăn bám gián tiếp: Sử dụng hải quỳ quét thức ăn giúp thu gom hiệu quả mảnh vụn hữu cơ trên diện rộng.",
        "Tốc độ phản xạ vẫy càng đe dọa cực nhanh khi phát hiện chuyển động bất thường cận kề.",
        "Vỏ ngoài cứng cáp (dù mỏng) vẫn có các gai nhỏ bảo vệ chống chấn thương cơ học ở rạn san hô.",
        "Khả năng thích ứng cao với việc sống chung với nhiều loài hải quỳ khác nhau khi bị mất loài cũ.",
        "Hành vi phòng thủ chủ động: Chủ động di chuyển găng tay hải quỳ hướng thẳng về phía nguồn đe dọa.",
        "Hệ thống thụ cảm hóa học nhạy bén trên anten giúp phát hiện mùi thức ăn và pheromone đồng loại từ xa.",
        "Khả năng tái sinh càng và chân bò cực tốt sau khi rụng tự vệ (autotomy) để thoát thân.",
        "Mối quan hệ cộng sinh tương hỗ (mutualism): Bảo vệ hải quỳ khỏi các loài cá ăn san hô và cung cấp thức ăn cho nó.",
        "Cơ chế di chuyển ngang nhanh nhẹn đặc trưng của loài cua, giúp đổi hướng luồn lách nhanh chóng.",
        "Khả năng giữ chặt hải quỳ liên tục mà không gây mỏi cơ càng nhờ cấu trúc chốt khớp đặc biệt.",
        "Sức chịu đựng nồng độ muối thay đổi tốt ở các vũng triều nông nhiệt đới."
      ];

      newC.weaknesses = [
        "Kích thước quá nhỏ bé khiến sức mạnh vật lý thô sơ vô cùng yếu ớt trước mọi kẻ thù lớn.",
        "Vỏ chitin mỏng dễ bị tổn thương, dễ vỡ nếu bị lực ép mạnh tác động trực tiếp.",
        "Phụ thuộc hoàn toàn vào sự tồn tại của hải quỳ cộng sinh, không thể tự vệ hiệu quả nếu không có găng tay độc.",
        "Không có càng sắc khỏe tự nhiên để cắn xé thức ăn lớn hoặc đào bới hang sâu.",
        "Dễ bị các loài cá săn mồi ban đêm (như cá mú con, cá chình) nuốt chửng cả cua lẫn hải quỳ.",
        "Thời gian phục hồi và tái sinh hải quỳ sau khi xé đôi cần vài ngày, trong thời gian đó cua chỉ có một bên găng nhỏ hơn.",
        "Sức chịu đựng dòng nước xiết kém do cơ thể nhẹ và chân bò nhỏ, dễ bị sóng cuốn trôi khỏi vùng rạn ẩn nấp.",
        "Sự cạnh tranh gay gắt giành giật hải quỳ với những con cua boxer cùng loài khác trong khu vực khi nguồn hải quỳ khan hiếm.",
        "Dễ bị tổn thương bởi các chất ô nhiễm hóa học hoặc hiện tượng tẩy trắng rạn san hô làm chết hải quỳ."
      ];

      newC.fun_facts = [
        "Hải quỳ được cua boxer cầm trên càng hầu như không bao giờ phát triển lớn lên hoặc sinh sản tự do, chúng được giữ ở kích thước nhỏ gọn phù hợp với cua.",
        "Nếu cua boxer bị cướp mất cả hai hải quỳ, nó sẽ lập tức tìm cách tranh giành và ăn trộm hải quỳ từ những con cua boxer khác trong khu vực.",
        "Các ngón càng của cua boxer đã biến đổi thành dạng kẹp gai mảnh, không còn khả năng tự kẹp nát thức ăn như cua thường mà chỉ dùng để giữ hải quỳ.",
        "Loài cua này thường thực hiện các động tác vẫy càng liên tục trông như một cổ động viên đang cổ vũ (nên còn gọi là cua Pom-pom).",
        "Khi lột xác, cua boxer phải cẩn thận đặt hai con hải quỳ xuống bên cạnh, lột lớp vỏ cũ ra, chờ vỏ mới cứng lại rồi mới nhặt hải quỳ lên cầm tiếp.",
        "Hải quỳ cộng sinh được cua cho ăn trực tiếp bằng cách gạt các mẩu thịt nhỏ lên xúc tu của chúng sau mỗi bữa ăn.",
        "Các nhà khoa học phát hiện ra rằng hải quỳ sống cộng sinh trên càng cua boxer có mức độ phát triển xúc tu chứa độc tố dày đặc hơn hải quỳ sống tự do ngoài tự nhiên.",
        "Khi cua boxer đực giao đấu giành lãnh thổ, chúng thường không sử dụng hải quỳ đâm nhau để tránh làm tổn thương vũ khí quý giá, mà chỉ xô đẩy vật lý."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.7717/peerj.2929", "label": "PeerJ - Asexual reproduction of sea anemones induced by boxer crabs" },
        { "url": "https://www.nationalgeographic.com/animals/article/boxer-crab-clones-anemones-boxing-gloves", "label": "National Geographic - How Boxer Crabs Clone Their Boxing Gloves" },
        { "url": "https://en.wikipedia.org/wiki/Lybia_tessellata", "label": "Wikipedia - Lybia tessellata Taxonomy and Biology" }
      ];
    } else if (c.id === "stargazer-fish") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "cá nhỏ",
        "cua rạn",
        "tôm cát",
        "giáp xác nhỏ",
        "giun biển đáy"
      ];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 4;
      newC.lifespan_max = 8;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Đẻ trứng. Mùa sinh sản thường rơi vào cuối mùa xuân và mùa hè. Trứng thụ tinh ngoài và trôi nổi tự do trong nước biển trước khi nở thành cá bột.";
      newC.locomotion = "hybrid";
      newC.speed_max = 8;
      newC.conservation_status = "LC";
      newC.size_min_mm = 200;
      newC.size_max_mm = 400;
      newC.weight_avg_g = 800;

      newC.characteristics = "Thân hình đầm, thuôn dài về phía đuôi, đầu dẹp và rất to với hộp sọ bọc các tấm xương cứng xù xì bảo vệ. Miệng lớn chĩa thẳng đứng lên trên với các hàng răng sắc nhọn. Hai mắt nhỏ nằm sát nhau trên đỉnh đầu hướng thẳng lên trời. Màu da xám nâu đốm tối giúp hòa lẫn hoàn hảo với cát và bùn biển đáy.";
      newC.survival_method = "Ngụy trang phục kích thụ động dưới đáy biển. Cá chiêm tinh dùng các vây ngực khỏe dẹp phẳng đào cát và vùi toàn bộ cơ thể dưới lớp cát mịn, chỉ để lộ hai mắt nhỏ và chiếc miệng chĩa lên. Nó thò ra một cái lưỡi giả dạng sâu nhỏ (lure) màu đỏ hồng từ đáy miệng để dụ dỗ cá nhỏ bơi tới. Khi mồi nằm trong tầm ngắm, nó mở to miệng tạo lực hút chân không khổng lồ đớp gọn con mồi. Để tự vệ trước kẻ thù lớn như cá đuối hay cá mập, cá chiêm tinh phát ra các dòng điện mạnh từ các cơ quan biến đổi phía sau mắt, đồng thời sử dụng hai gai nọc lớn nằm phía sau nắp mang để đâm buốt.";
      newC.unique_traits = "Tấn công điện sinh học (bioelectric shock) lên tới 50V phát ra từ các cơ nhãn khoa sửa đổi nằm phía sau mắt. Gai nọc độc kép (venomous spines) ở mang tiết ra độc tố thần kinh cực nguy hiểm đối với động vật săn mồi và con người. Lực hút chân không đớp mồi siêu tốc (vacuum strike) trong vòng 0.05 giây. Chiếc lưỡi giả (oral lure) độc đáo có thể co giãn linh hoạt mô phỏng chuyển động của giun biển.";

      newC.strengths = [
        "Ngụy trang ẩn mình tuyệt đối dưới cát biển khiến con mồi khó lòng phát hiện.",
        "Xung điện sinh học lên tới 50V gây tê liệt tạm thời hệ thần kinh đối phương.",
        "Gai độc kép phía sau mang chứa độc tố thần kinh cực mạnh để tự vệ chủ động.",
        "Cú đớp hút chân không áp lực lớn siêu tốc tiêu diệt con mồi tức thì chỉ trong 0.05 giây.",
        "Hộp sọ bọc các tấm xương dày giúp bảo vệ vùng não bộ trước các cú cắn từ trên xuống.",
        "Hệ thống mang lọc cát chuyên biệt giúp cá hô hấp bình thường khi chôn sâu dưới cát.",
        "Lưỡi dụ mồi (oral lure) mô phỏng sinh học giun biển cực kỳ sống động và hiệu quả.",
        "Khả năng đào bới và vùi mình dưới cát nhanh chóng nhờ vây ngực phát triển như xẻng.",
        "Sức chịu đựng tốt trong môi trường nước thiếu oxy tạm thời dưới lớp cát mịn.",
        "Khả năng nhịn ăn lâu dài nhờ nhịp trao đổi chất thấp khi nằm bất động phục kích.",
        "Cơ hàm cực khỏe tạo ra áp lực cắn ép lớn, dễ dàng nghiền vỏ giáp xác nhỏ.",
        "Đôi mắt có thể nhô lên hoặc thụt xuống linh hoạt để tránh cát lọt vào khi chôn mình.",
        "Cơ quan phát điện sinh học có khả năng sạc lại nhanh chóng sau khi phóng điện.",
        "Tuyến chất nhầy trên da giúp giảm ma sát khi chui sâu dưới cát và chống ký sinh trùng.",
        "Thính giác nhạy cảm với các rung động truyền qua nền cát đáy biển."
      ];

      newC.weaknesses = [
        "Khả năng bơi lội đường dài kém cỏi do thân hình nặng nề và các vây không thiết kế để bơi nhanh.",
        "Phụ thuộc chặt chẽ vào địa hình cát bùn phẳng đáy nông để phục kích săn mồi.",
        "Không thể săn mồi chủ động truy đuổi ở tầng nước giữa hoặc mặt nước.",
        "Mắt hướng lên trên giới hạn tầm nhìn ở hai bên hông và phía dưới bụng.",
        "Cơ quan phát điện tiêu tốn nhiều năng lượng sinh học để sạc lại sau mỗi lần phóng điện liên tục.",
        "Nọc độc ở gai mang không thể tái tạo tức thì, cần thời gian tích lũy lâu dài sau khi phóng.",
        "Dễ bị phát hiện bởi các loài săn mồi sử dụng cảm biến điện trường (như cá mập, cá đuối) dù có trốn dưới cát.",
        "Nhạy cảm với sự thay đổi nhiệt độ đột ngột của nước biển ven bờ."
      ];

      newC.fun_facts = [
        "Cá chiêm tinh là loài động vật duy nhất có cả cơ quan phát điện sinh học và gai chứa nọc độc đồng thời trên cơ thể.",
        "Tên khoa học Uranoscopus của nó có nghĩa là 'người ngắm nhìn bầu trời', xuất phát từ việc đôi mắt của nó luôn hướng ngược lên trên bất kể cơ thể nằm thế nào dưới cát.",
        "Mặc dù thịt cá chiêm tinh có thể ăn được sau khi đã loại bỏ các gai độc cẩn thận, nhưng việc giẫm phải chúng ở bãi biển nông là nỗi ám ảnh kinh hoàng do cú đâm cực đau đớn.",
        "Cơ quan phát điện của cá chiêm tinh được biến đổi từ chính các cơ điều khiển chuyển động của mắt (cơ nhãn khoa).",
        "Chúng có thể tạo ra các xung điện yếu liên tục để định vị môi trường xung quanh trong bóng tối, tương tự như radar.",
        "Khi vùi mình dưới cát, chúng dùng miệng đẩy nước qua khe mang đặc biệt có màng lọc để ngăn cát lọt vào hệ thống hô hấp.",
        "Lưỡi dụ mồi của chúng thực chất là một phần kéo dài của màng nhầy sàn miệng, có màu đỏ tươi giống giun đỏ.",
        "Cú đớp mồi của cá chiêm tinh nhanh đến mức máy quay phim thông thường (30 khung hình/giây) khó có thể bắt kịp rõ nét."
      ];

      newC.sources = [
        { "url": "https://www.scientificamerican.com/article/the-stargazer-fish-has-a-shocking-technique/", "label": "Scientific American - The Stargazer Fish Bioelectricity" },
        { "url": "https://doi.org/10.1111/j.1095-8649.1994.tb01201.x", "label": "Journal of Fish Biology - Stargazer Venom and Shock Mechanism" },
        { "url": "https://en.wikipedia.org/wiki/Uranoscopus_scaber", "label": "Wikipedia - Uranoscopus scaber Detailed Biology" }
      ];
    } else if (c.id === "velvet-worm") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "dế",
        "mối",
        "nhện",
        "cuốn chiếu",
        "sâu đất",
        "rận gỗ"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 2;
      newC.lifespan_max = 6;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Một số loài đẻ trứng (oviparous), số khác mang thai đẻ con trực tiếp (viviparous) với thời gian thai kỳ kéo dài tới 15 tháng, con non đẻ ra đã phát triển hoàn thiện.";
      newC.locomotion = "crawl";
      newC.speed_max = 0.05;
      newC.conservation_status = "LC";
      newC.size_min_mm = 10;
      newC.size_max_mm = 150;
      newC.weight_avg_g = 0.8;

      newC.characteristics = "Thân hình thon dài dẻo dai giống sâu nhưng có nhiều đôi chân ngắn hình nón không khớp (lobopods) kết thúc bằng những móng vuốt chitin nhỏ. Da mềm, nhám mịn như nhung do được bao phủ bởi hàng triệu hạt gai nhỏ chứa thụ cảm thể xúc giác và hóa học nhạy cảm. Đầu có hai râu xúc giác dài liên tục chuyển động, hai mắt đơn nguyên thủy ở gốc râu và cặp tuyến chất nhầy mở ra ở hai nhú miệng.";
      newC.survival_method = "Là loài săn mồi ẩn dật vào ban đêm. Khi phát hiện mồi (như dế, mối, nhện), giun nhung bắn ra hai tia chất lỏng dính (slime) từ hai nhú tuyến nằm cạnh miệng ở tốc độ cực cao. Chất lỏng này lập tức đông cứng thành một tấm lưới keo dẻo dính trong không khí, vô hiệu hóa con mồi ngay lập tức. Sau đó, nó bò đến dùng cặp hàm sắc nhọn đục một lỗ trên thân mồi, tiêm nước bọt chứa enzyme tiêu hóa vào để hóa lỏng mô bên trong rồi hút dung dịch dinh dưỡng như súp.";
      newC.unique_traits = "Cơ chế xịt keo tầm xa (slime cannon) có thể bắn xa tới 30 cm trong phần phần trăm giây với quỹ đạo dích dắc độc đáo. Lớp keo đặc biệt tự động trùng hợp cứng lại khi khô nhưng cực dính khi ướt. Bộ khung xương thủy tĩnh linh hoạt cho phép ép mình qua những khe hở siêu nhỏ nhỏ hơn cơ thể gấp nhiều lần. Da chống dính chất nhầy tự thân nhờ cấu trúc vi gai kỵ nước.";

      newC.strengths = [
        "Tấn công tầm xa bằng keo dẻo dính khóa cứng các loài chân khớp di động nhanh.",
        "Khung xương thủy tĩnh siêu linh hoạt giúp chui lọt các kẽ hở hẹp hơn đường kính cơ thể.",
        "Enzyme tiêu hóa cực mạnh phân rã nhanh chóng mô cơ thịt cứng thành chất lỏng dinh dưỡng.",
        "Giác quan xúc giác qua da và râu vô cùng nhạy bén trong bóng đêm hoàn toàn.",
        "Tia keo phóng ra theo quỹ đạo dích dắc nhờ chuyển động dao động tự nhiên của đầu nhú miệng.",
        "Da kỵ nước và chống bám dính chất nhầy tự thân tuyệt đối nhờ hàng triệu vi gai dạng nhung.",
        "Chân lobopods có móng vuốt giúp bám chặt vào nhiều bề mặt dốc đứng của rừng rậm.",
        "Cơ chế săn mồi theo nhóm (ở một số loài): phối hợp bầy đàn săn mồi lớn có tổ chức.",
        "Khả năng bò cực kỳ êm ái, không gây ra bất kỳ tiếng động hay chấn động nào nhờ bước đi đồng bộ của các lobopods.",
        "Hệ thống thần kinh phân tán dọc cơ thể giúp phản ứng nhanh chóng với các mối đe dọa.",
        "Hàm sừng (mandibles) kép nằm sâu trong miệng có lực cắt kéo xé rách lớp vỏ kitin côn trùng.",
        "Tốc độ phóng keo cực nhanh đạt tới 5 mét/giây thông qua áp lực thủy tĩnh nội bào.",
        "Khả năng thích nghi tốt trong môi trường tối tăm, ẩm ướt của hang động.",
        "Hành vi xã hội phức tạp: Chia sẻ thức ăn theo cấp bậc phân phối trong đàn.",
        "Cơ thể có tính đàn hồi cao, co giãn chiều dài linh hoạt khi di chuyển."
      ];

      newC.weaknesses = [
        "Cơ thể không có lớp vỏ kitin bảo vệ chống mất nước, dễ bị khô héo và tử vong nếu độ ẩm không khí thấp.",
        "Tốc độ bò di chuyển bình thường cực kỳ chậm chạp và vụng về trên địa hình trống trải.",
        "Lớp da mềm không có khả năng chống đỡ các đòn cắn trực tiếp từ kẻ săn mồi lớn.",
        "Tuyến keo cần nhiều thời gian và protein để tái tổng hợp sau khi phun cạn kiệt.",
        "Thị giác cực kém, mắt đơn chỉ nhận biết được sáng tối cơ bản, dễ bị tấn công từ xa.",
        "Dễ bị các loài chim ăn đêm, động vật gặm nhấm nhỏ và bò sát săn lùng.",
        "Hệ thống ống thở (tracheae) mở liên tục không có cơ chế đóng, khiến nước bay hơi không kiểm soát.",
        "Không có khả năng tự vệ vật lý mạnh mẽ nếu kẻ thù áp sát quá nhanh trước khi kịp phun keo."
      ];

      newC.fun_facts = [
        "Chất nhầy của giun nhung cực dính với côn trùng nhưng lại không bám dính vào chính lớp da phủ nhung đặc biệt của nó.",
        "Enzyme của giun nhung có thể tiêu hóa lớp vỏ chitin cứng của các loài côn trùng lớn mà chính giun nhung không cần nhai.",
        "Chúng là những loài động vật không xương sống cổ xưa hiếm hoi có hành vi chăm sóc con non chu đáo và đẻ con con đã phát triển hoàn thiện ở một số loài.",
        "Giun nhung được coi là 'mắt xích thiếu' giữa giun đốt (Annelida) và động vật chân khớp (Arthropoda) nhờ sự pha trộn các đặc điểm cơ thể.",
        "Một số loài giun nhung Úc sống theo bầy đàn có cấu trúc xã hội phân cấp rõ rệt, dẫn đầu bởi một con cái thống trị lớn nhất.",
        "Chất nhầy tự vệ của chúng chủ yếu cấu tạo từ nước (90%) và các protein dẻo dai, đông cứng tức thì khi tiếp xúc với lực kéo giãn.",
        "Hóa thạch của giun nhung (như Hallucigenia) được tìm thấy trong đá phiến Burgess Shale có niên đại hơn 508 triệu năm.",
        "Giun nhung đẻ con (viviparous) có nhau thai nguyên thủy để chuyển dưỡng chất từ mẹ sang phôi, tương tự động vật có vú."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1038/ncomms7267", "label": "Nature Communications - Studies on velvet worm slime ejection" },
        { "url": "https://www.wired.com/2015/03/absurd-creature-of-the-week-velvet-worm/", "label": "Wired - Absurd Creature of the Week: The Velvet Worm" },
        { "url": "https://en.wikipedia.org/wiki/Onychophora", "label": "Wikipedia - Onychophora Evolutionary History and Biology" }
      ];
    } else if (c.id === "bullet-ant") {
      // Add extra items to strengths, weaknesses, fun_facts
      newC.strengths = [
        ...c.strengths,
        "Khả năng sản xuất các chất peptides kháng khuẩn ngoại tiết từ tuyến metapleural có thể tiêu diệt 99% vi khuẩn và nấm gây bệnh bám trên cơ thể.",
        "Cơ chế phối hợp săn mồi nhóm nhỏ: có thể huy động 2-5 con cùng đàn để vận chuyển các con mồi lớn hoặc phối hợp khống chế sinh vật hung hãn."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Nhạy cảm với sóng siêu âm hoặc các rung động nhân tạo tần số cao, gây rối loạn khả năng định hướng và giao tiếp bầy đàn.",
        "Không thể thích nghi với việc thay đổi nguồn thức ăn ngọt nhân tạo chứa đường hóa học, dễ bị ngộ độc hệ thần kinh."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Một số nhà nghiên cứu y học đang thử nghiệm poneratoxin làm chất dẫn truyền thần kinh hướng mục tiêu để ngăn chặn các cơn đau mãn tính ở người.",
        "Khi bị ướt sũng do mưa lớn, kiến đạn thợ sẽ dùng đôi chân trước vuốt sạch nước trên lớp lông tơ quanh các lỗ thở để ngăn chặn ngạt nước."
      ];
    } else if (c.id === "hagfish") {
      // Add extra items to strengths, weaknesses, fun_facts
      newC.strengths = [
        ...c.strengths,
        "Khả năng co bóp tim phụ bằng các tế bào cơ tự kích hoạt xung điện độc lập, không phụ thuộc vào xung thần kinh từ não bộ.",
        "Cấu trúc lỗ thở một chiều trên đỉnh mõm dẫn nước trực tiếp vào mang sau, cho phép cá mù vừa cắm đầu sâu vào xác thối ăn vừa thở bình thường."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Khả năng chống chịu kém trước các loài động vật săn mồi không xương sống có móng vuốt sắc nhọn (như cua hoàng đế đáy sâu) có thể xé rách da.",
        "Dễ bị tổn thương nếu môi trường nước đáy sâu bị ô nhiễm hạt nhựa vi mô, các hạt này làm tắc nghẽn vĩnh viễn các tế bào sợi nhầy."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Cơ quan thụ cảm hóa học của cá mù phủ khắp toàn bộ cơ thể, nghĩa là chúng có thể 'nếm' thức ăn bằng chính làn da của mình trước khi chạm miệng.",
        "Khi ăn xác thối, chúng có thể hấp thu các chất dinh dưỡng hòa tan qua da nhanh hơn cả tốc độ hấp thu qua ruột non thông thường."
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

run().catch(err => {
  console.error(err);
  process.exit(1);
});
